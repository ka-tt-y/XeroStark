use std::path::{Path, PathBuf};

use regex::Regex;
use serde_json::Value;
use tokio::{fs, process::Command};
use tracing::info;

const GROQ_MODEL: &str = "openai/gpt-oss-20b";

/// Extract input signal names from circom circuit code
/// Returns a vector of signal names (e.g., ["a", "b"])
pub fn extract_input_signals(circuit_code: &str) -> Vec<String> {
    let mut inputs = Vec::new();

    // Match patterns like:
    // signal input a;
    // signal input b;
    // signal input mySignal;
    // signal input arr[10];
    let re = Regex::new(r"signal\s+input\s+(\w+)(?:\s*\[\s*\d+\s*\])?").unwrap();

    for cap in re.captures_iter(circuit_code) {
        if let Some(name) = cap.get(1) {
            inputs.push(name.as_str().to_string());
        }
    }

    inputs
}

/// Extract output signal names from circom circuit code
/// Returns a vector of signal names (e.g., ["out", "result"])
pub fn extract_output_signals(circuit_code: &str) -> Vec<String> {
    let mut outputs = Vec::new();
    let re = Regex::new(r"signal\s+output\s+(\w+)(?:\s*\[\s*\d+\s*\])?").unwrap();

    for cap in re.captures_iter(circuit_code) {
        if let Some(name) = cap.get(1) {
            outputs.push(name.as_str().to_string());
        }
    }

    outputs
}

/// Extract publicly-declared input signal names from the `component main {public [...]}` line.
/// These are the input signals whose VALUES appear in the public signals array (after outputs).
pub fn extract_public_input_signals(circuit_code: &str) -> Vec<String> {
    let re = Regex::new(r"component\s+main\s*\{[^}]*public\s*\[([^\]]*)\]").unwrap();
    if let Some(caps) = re.captures(circuit_code) {
        return caps[1]
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
    }
    Vec::new()
}

/// Generate Groth16 verifier contract using garaga CLI directly
pub async fn generate_garaga_verifier(
    vk_path: &Path,
    output_dir: &Path,
    project_name: &str,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
    // Ensure output directory exists
    fs::create_dir_all(output_dir).await?;
    info!("Generating garaga verifier in {:?}", output_dir);

    // 1. Load and clean the VK JSON (remove vk_alphabeta_12 if present)
    let vk_json_str = fs::read_to_string(vk_path).await?;
    let mut vk_json: Value = serde_json::from_str(&vk_json_str)?;

    // Remove vk_alphabeta_12 field if it exists (garaga doesn't expect it)
    if let Some(obj) = vk_json.as_object_mut() {
        obj.remove("vk_alphabeta_12");
    }

    // Save cleaned VK to output directory
    let cleaned_vk_path = output_dir.join("vk_clean.json");
    let cleaned_vk_str = serde_json::to_string_pretty(&vk_json)?;
    fs::write(&cleaned_vk_path, cleaned_vk_str).await?;

    // 2. Call garaga gen - it generates in the current directory, so we change to output_dir
    // The command is simply: garaga gen --system groth16 --vk <path>
    let garaga_output = Command::new("garaga")
        .arg("gen")
        .arg("--system")
        .arg("groth16")
        .arg("--vk")
        .arg(&cleaned_vk_path)
        .arg("--project-name")
        .arg(project_name)
        .arg("--no-include-test-sample")
        .current_dir(output_dir) // Run in output_dir so it generates there
        .output()
        .await?;

    if !garaga_output.status.success() {
        let stderr = String::from_utf8_lossy(&garaga_output.stderr);
        let stdout = String::from_utf8_lossy(&garaga_output.stdout);
        tracing::error!("Garaga gen failed. stderr: {}, stdout: {}", stderr, stdout);
        return Err(format!("Garaga generation failed: {}", stderr).into());
    }

    tracing::info!(
        "Garaga gen output: {}",
        String::from_utf8_lossy(&garaga_output.stdout)
    );

    // 3. Find the generated project directory
    // Garaga creates a subdirectory like verifier_bn254 or verifier_bls12_381
    let project_dir = find_garaga_project(output_dir).await?;

    // Clean up temporary cleaned VK file
    let _ = fs::remove_file(&cleaned_vk_path).await;

    Ok(project_dir)
}

/// Find the garaga-generated project directory
async fn find_garaga_project(output_dir: &Path) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let mut entries = fs::read_dir(output_dir).await?;

    while let Some(entry) = entries.next_entry().await? {
        let path = entry.path();

        // Look for directories starting with "verifier_"
        if path.is_dir() {
            let dir_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

            if dir_name.starts_with("verifier_") {
                // Check if Scarb.toml exists
                let scarb_toml = path.join("Scarb.toml");
                if scarb_toml.exists() {
                    tracing::info!("Found garaga project at: {:?}", path);
                    return Ok(path);
                }
            }
        }
    }

    Err(format!("Could not find garaga project in {:?}", output_dir).into())
}

/// Generate a circuit description using Groq's API.
/// Takes the circuit source code and returns a concise, tailored description.
pub async fn generate_circuit_description(
    client: &reqwest::Client,
    circuit_name: &str,
    circuit_code: &str,
) -> Result<String, String> {
    let api_key = std::env::var("GROQ_API_KEY").unwrap_or_default();
    if api_key.is_empty() {
        return Err("GROQ_API_KEY not set".to_string());
    }

    let prompt = format!(
        "You are writing a short description for a zero-knowledge proof page.\n\
         \n\
         Analyze the circuit \"{}\" and describe what a proof generated from it PROVES — \
         from the verifier's perspective.\n\
         \n\
         Rules:\n\
         - Focus on what the prover demonstrates knowledge of, without revealing private inputs.\n\
         - Reference the public output(s) if the circuit has them.\n\
         - Example for a Multiplier circuit: \"This proof demonstrates that the prover knows two private numbers that, when multiplied together, produce the public output.\"\n\
         - Example for a RangeProof circuit: \"RangeProof demonstrates that the prover knows a secret number that falls within a specified range, without revealing the number itself.\"\n\
         - Be concrete and specific to what the code does — identify the input signals and output signals.\n\
         - Maximum 2 sentences, under 80 words.\n\
         - Must not always start with \"This circuit\" or \"This proof\". Make it varied and engaging.\n\
         - Output ONLY the description text, nothing else.\n\
         \n\
         ```circom\n{}\n```",
        circuit_name, circuit_code
    );

    let body = serde_json::json!({
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 150,
        "temperature": 0.5
    });

    let response = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Groq API request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Groq API error {}: {}", status, text));
    }

    let resp_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Groq response: {}", e))?;

    resp_json["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.trim().to_string())
        .ok_or_else(|| "No content in Groq response".to_string())
}

/// Generate user-friendly descriptions for each input signal in a circuit using Groq LLM.
/// Returns a JSON object mapping signal names to their descriptions.
pub async fn generate_input_descriptions(
    client: &reqwest::Client,
    circuit_name: &str,
    circuit_code: &str,
    input_signals: &[String],
) -> Result<std::collections::HashMap<String, String>, String> {
    let api_key = std::env::var("GROQ_API_KEY").unwrap_or_default();
    if api_key.is_empty() {
        return Err("GROQ_API_KEY not set".to_string());
    }

    let signals_list = input_signals.join(", ");
    let prompt = format!(
        "You are an expert in zero-knowledge proof circuits written in Circom. \
         Given the following Circom circuit named \"{}\" with input signals: [{}], \
         provide a brief one-line description for each input signal explaining what value \
         the user should enter and what it represents. \
         Respond ONLY with valid JSON — an object mapping each signal name to its description. \
         Example format: {{\"a\": \"First number to multiply\", \"b\": \"Second number to multiply\"}}\n\n\
         ```circom\n{}\n```",
        circuit_name, signals_list, circuit_code
    );

    let body = serde_json::json!({
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 300,
        "temperature": 0.2
    });

    let response = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Groq API request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Groq API error {}: {}", status, text));
    }

    let resp_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Groq response: {}", e))?;

    let content = resp_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "No content in Groq response".to_string())?
        .trim();

    // Parse the JSON response — the LLM might wrap it in markdown code blocks
    let json_str = if content.starts_with("```") {
        content
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim()
    } else {
        content
    };

    let parsed: std::collections::HashMap<String, String> = serde_json::from_str(json_str)
        .map_err(|e| {
            format!(
                "Failed to parse LLM response as JSON: {} — raw: {}",
                e, json_str
            )
        })?;

    Ok(parsed)
}

/// Generate user-friendly descriptions for each output signal in a circuit using Groq LLM.
/// Returns a JSON object mapping signal names to their descriptions.
pub async fn generate_output_descriptions(
    client: &reqwest::Client,
    circuit_name: &str,
    circuit_code: &str,
    output_signals: &[String],
) -> Result<std::collections::HashMap<String, String>, String> {
    let api_key = std::env::var("GROQ_API_KEY").unwrap_or_default();
    if api_key.is_empty() {
        return Err("GROQ_API_KEY not set".to_string());
    }

    if output_signals.is_empty() {
        return Ok(std::collections::HashMap::new());
    }

    let signals_list = output_signals.join(", ");
    let prompt = format!(
        "You are an expert in zero-knowledge proof circuits written in Circom. \
         Given the following Circom circuit named \"{}\" with public output signals: [{}], \
         provide a brief one-line description for each output signal explaining what value \
         it represents and how to interpret it when reading a proof's public signals. \
         IMPORTANT: For boolean/flag signals that represent success or validity, always specify both cases clearly — \
         e.g. \"1 if [condition], 0 otherwise\". Read the circuit logic carefully to determine \
         exactly what value is assigned in each case. Do NOT say \"1 otherwise\" when the false case is 0. \
         Respond ONLY with valid JSON — an object mapping each signal name to its description. \
         Example format: {{\"out\": \"The product of the two input numbers\", \"valid\": \"1 if the value is within range, 0 otherwise\"}}\n\n\
         ```circom\n{}\n```",
        circuit_name, signals_list, circuit_code
    );

    let body = serde_json::json!({
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 300,
        "temperature": 0.0
    });

    let response = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Groq API request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Groq API error {}: {}", status, text));
    }

    let resp_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Groq response: {}", e))?;

    let content = resp_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "No content in Groq response".to_string())?
        .trim();

    // Parse the JSON response
    let json_str = if content.starts_with("```") {
        content
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim()
    } else {
        content
    };

    let parsed: std::collections::HashMap<String, String> = serde_json::from_str(json_str)
        .map_err(|e| {
            format!(
                "Failed to parse LLM response as JSON: {} — raw: {}",
                e, json_str
            )
        })?;

    Ok(parsed)
}
