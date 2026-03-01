use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Pool, Postgres};

use crate::db::database::DatabaseConnection;
use crate::db::errors::DatabaseError as Error;

pub mod database;
pub mod errors;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Circuit {
    pub id: i32,
    pub hash: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub code: Option<String>,
    pub circuit_type: CircuitType,
    pub created_by: Option<String>,
    pub is_public: Option<bool>,
}

#[derive(sqlx::Type, Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[sqlx(type_name = "circuit_type_", rename_all = "lowercase")]
pub(crate) enum CircuitType {
    Circom,
    Noir,
}

#[derive(sqlx::Type, Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[sqlx(type_name = "deployment_type_", rename_all = "lowercase")]
pub(crate) enum DeploymentType {
    System,
    User,
}
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ProofArtifact {
    pub id: i32,
    pub circuit_id: i32,
    pub vk_json: String,
    pub wasm_path: String,
    pub zkey_path: String,
    pub witness_js_path: String,
    pub input_signals: Option<Vec<String>>,
    pub output_signals: Option<Vec<String>>,
    pub public_input_signals: Option<Vec<String>>,
    pub output_descriptions: Option<serde_json::Value>,
    pub public_input_descriptions: Option<serde_json::Value>,
    pub input_descriptions: Option<serde_json::Value>,
}
#[derive(sqlx::Type, Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[sqlx(type_name = "deployment_status_", rename_all = "lowercase")]
pub enum DeploymentStatus {
    Pending,
    Confirmed,
    Failed,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Deployment {
    pub id: i32,
    pub circuit_id: i32,
    pub deployment_type: DeploymentType,
    pub deployed_by_address: Option<String>,
    pub tx_hash: Option<String>,
    pub contract_address: Option<String>,
    pub class_hash: Option<String>,
    pub available_endpoints: Option<Vec<String>>,
    pub status: DeploymentStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedCircuitData {
    pub circuit: Circuit,
    pub artifact: ProofArtifact,
    pub deployment: Option<Deployment>,
}

pub struct Db {
    pool: Pool<Postgres>,
}

impl Db {
    pub async fn new(connection: DatabaseConnection) -> Result<Self, Error> {
        let pool = connection.connect().await?;
        Ok(Self { pool })
    }

    /// Check if a circuit exists by hash
    pub async fn circuit_exists(&self, circuit_hash: &str) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"SELECT EXISTS(SELECT 1 FROM circuits WHERE hash = $1) as "exists!: bool""#,
            circuit_hash
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.exists)
    }

    /// Insert a new circuit and return the circuit ID
    pub async fn insert_circuit(
        &self,
        hash: &str,
        code: &str,
        circuit_type: CircuitType,
        name: Option<&str>,
        description: Option<&str>,
        created_by: Option<&str>,
        is_public: bool,
    ) -> Result<i32, Error> {
        let result = sqlx::query!(
            r#"
            INSERT INTO circuits (hash, code, circuit_type, name, description, is_public, created_by)
            VALUES ($1, $2, $3::circuit_type_, $4, $5, $6, $7)
            RETURNING id
            "#,
            hash,
            code,
            circuit_type as CircuitType,
            name,
            description,
            is_public,
            created_by,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.id)
    }

    /// Upsert a circuit for the setup flow. If the circuit hash already exists
    /// reuse the existing row and update metadata. Otherwise insert a new circuit.
    pub async fn upsert_circuit_for_setup(
        &self,
        hash: &str,
        code: &str,
        circuit_type: CircuitType,
        name: Option<&str>,
        description: Option<&str>,
        created_by: Option<&str>,
        is_public: bool,
    ) -> Result<i32, Error> {
        // Check if a circuit with this hash already exists
        let existing = sqlx::query!(r#"SELECT id FROM circuits WHERE hash = $1"#, hash,)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = existing {
            // Update metadata on the existing circuit (set creator if not yet set, update public flag, set description if provided)
            sqlx::query!(
                r#"UPDATE circuits SET created_by = COALESCE(created_by, $1), is_public = $2, name = COALESCE($4, name), description = COALESCE($5, description) WHERE id = $3"#,
                created_by,
                is_public,
                row.id,
                name,
                description,
            )
            .execute(&self.pool)
            .await?;
            return Ok(row.id);
        }

        // Insert new circuit
        self.insert_circuit(
            hash,
            code,
            circuit_type,
            name,
            description,
            created_by,
            is_public,
        )
        .await
    }

    /// Insert proof artifacts for a circuit
    pub async fn insert_proof_artifact(
        &self,
        circuit_id: i32,
        vk_json: &str,
        wasm_path: &str,
        zkey_path: &str,
        witness_js_path: &str,
        input_signals: &[String],
        output_signals: &[String],
        public_input_signals: &[String],
        output_descriptions: Option<&serde_json::Value>,
        public_input_descriptions: Option<&serde_json::Value>,
        input_descriptions: Option<&serde_json::Value>,
    ) -> Result<i32, Error> {
        let empty_json = serde_json::json!({});
        let out_desc = output_descriptions.unwrap_or(&empty_json);
        let pub_in_desc = public_input_descriptions.unwrap_or(&empty_json);
        let in_desc = input_descriptions.unwrap_or(&empty_json);

        let result = sqlx::query!(
            r#"
            INSERT INTO proof_artifacts
                (circuit_id, vk_json, wasm_path, zkey_path, witness_js_path,
                 input_signals, output_signals, public_input_signals,
                 output_descriptions, public_input_descriptions, input_descriptions)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
            "#,
            circuit_id,
            vk_json,
            wasm_path,
            zkey_path,
            witness_js_path,
            input_signals,
            output_signals,
            public_input_signals,
            out_desc,
            pub_in_desc,
            in_desc,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.id)
    }

    /// Insert a deployment record
    pub async fn insert_deployment(
        &self,
        circuit_id: i32,
        deployment_type: DeploymentType,
        contract_address: &str,
        class_hash: &str,
        available_endpoints: Option<&[String]>,
        tx_hash: Option<&str>,
        deployed_by_address: Option<&str>,
    ) -> Result<i32, Error> {
        let result = sqlx::query!(
            r#"
            INSERT INTO deployments 
            (circuit_id, deployment_type, contract_address, class_hash, available_endpoints, tx_hash, status, deployed_by_address)
            VALUES ($1, $2::deployment_type_, $3, $4, $5, $6, 'confirmed'::deployment_status_, $7)
            RETURNING id
            "#,
            circuit_id,
            deployment_type as DeploymentType,
            contract_address,
            class_hash,
            available_endpoints,
            tx_hash,
            deployed_by_address,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result.id)
    }

    /// Get just the circuit record by hash (lightweight, no joins)
    pub async fn get_circuit_record_by_hash(&self, circuit_hash: &str) -> Result<Circuit, Error> {
        let circuit = sqlx::query_as!(
            Circuit,
            r#"
            SELECT id, hash, name, description, code,
                   circuit_type as "circuit_type: _",
                   created_by, is_public
            FROM circuits
            WHERE hash = $1
            "#,
            circuit_hash
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(circuit)
    }

    /// Get complete circuit data by hash (replaces cache lookup)
    pub async fn get_circuit_by_hash(
        &self,
        circuit_hash: &str,
    ) -> Result<CachedCircuitData, Error> {
        let circuit = sqlx::query_as!(
            Circuit,
            r#"
            SELECT id, hash, name, description, code, 
                   circuit_type as "circuit_type: _",
                   created_by, is_public
            FROM circuits 
            WHERE hash = $1
            "#,
            circuit_hash
        )
        .fetch_one(&self.pool)
        .await?;

        let artifact = sqlx::query_as!(
            ProofArtifact,
            r#"
            SELECT id, circuit_id as "circuit_id!", vk_json, wasm_path, zkey_path, witness_js_path,
                   input_signals, output_signals, public_input_signals,
                   output_descriptions, public_input_descriptions, input_descriptions
            FROM proof_artifacts
            WHERE circuit_id = $1
            "#,
            circuit.id
        )
        .fetch_one(&self.pool)
        .await?;

        // Get the most recent confirmed deployment
        let deployment = sqlx::query_as!(
            Deployment,
            r#"
            SELECT id, circuit_id, 
                   deployment_type as "deployment_type: DeploymentType",
                   deployed_by_address, tx_hash, contract_address, 
                   class_hash, available_endpoints,
                   status as "status: DeploymentStatus"
            FROM deployments
            WHERE circuit_id = $1 AND status = 'confirmed'
            ORDER BY created_at DESC
            LIMIT 1
            "#,
            circuit.id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(CachedCircuitData {
            circuit,
            artifact,
            deployment,
        })
    }

    /// Check if this exact proof (same circuit + same proof data) is already verified.
    /// Different private inputs produce different proofs even if the public output is the same,
    /// so we match on proof_data, NOT public_inputs.
    pub async fn get_existing_verified_proof(
        &self,
        circuit_id: i32,
        proof_data: &str,
    ) -> Result<(i32, Option<String>), Error> {
        let proof_json: serde_json::Value = serde_json::from_str(proof_data)
            .map_err(|e| Error::QueryError(format!("Invalid proof JSON: {}", e)))?;

        let row = sqlx::query!(
            r#"
            SELECT id, tx_hash
            FROM proofs
            WHERE circuit_id = $1
              AND proof_data = $2
              AND verification_status = 'verified'::proof_verification_status_
            "#,
            circuit_id,
            &proof_json,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok((row.id, row.tx_hash))
    }

    /// Insert a verified proof (used after on-chain verification succeeds).
    /// Each unique proof (different private inputs) gets its own row, even if the
    /// public output is the same. If the exact same proof_data already exists for
    /// this circuit, we update it instead of creating a duplicate.
    pub async fn insert_verified_proof(
        &self,
        circuit_id: i32,
        proof_data: &str,
        public_inputs: &str,
        tx_hash: Option<&str>,
        created_by: Option<&str>,
    ) -> Result<i32, Error> {
        let proof_json: serde_json::Value = serde_json::from_str(proof_data)
            .map_err(|e| Error::QueryError(format!("Invalid proof JSON: {}", e)))?;
        let public_json: serde_json::Value = serde_json::from_str(public_inputs)
            .map_err(|e| Error::QueryError(format!("Invalid public inputs JSON: {}", e)))?;

        // Dedup on proof_data (not public_inputs) — same proof already stored? update it.
        let existing = sqlx::query_scalar!(
            r#"SELECT id FROM proofs WHERE circuit_id = $1 AND proof_data = $2"#,
            circuit_id,
            &proof_json,
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(id) = existing {
            sqlx::query!(
                r#"
                UPDATE proofs
                SET tx_hash = $1,
                    tx_status = CASE WHEN $1::varchar IS NULL THEN tx_status ELSE 'confirmed' END,
                    verification_status = 'verified'::proof_verification_status_,
                    created_by = COALESCE(created_by, $2)
                WHERE id = $3
                "#,
                tx_hash,
                created_by,
                id,
            )
            .execute(&self.pool)
            .await?;

            return Ok(id);
        }

        let id: i32 = sqlx::query_scalar!(
            r#"
            INSERT INTO proofs (circuit_id, proof_data, public_inputs, verification_status, tx_hash, created_by)
            VALUES ($1, $2, $3, 'verified'::proof_verification_status_, $4, $5)
            RETURNING id
            "#,
            circuit_id,
            proof_json,
            public_json,
            tx_hash,
            created_by,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(id)
    }

    /// Get circuits created or deployed by a user
    pub async fn get_user_circuits(
        &self,
        user_address: &str,
    ) -> Result<Vec<CircuitWithDeployment>, Error> {
        let circuits = sqlx::query_as!(
            CircuitWithDeployment,
            r#"
            SELECT DISTINCT 
                c.id, c.hash, c.name, c.description, c.code,
                c.circuit_type as "circuit_type: _",
                c.created_by, c.is_public, c.created_at,
                d.contract_address as deployed_address,
                d.deployment_type as "deployment_type?: DeploymentType",
                pa.input_signals,
                pa.input_descriptions
            FROM circuits c
            LEFT JOIN deployments d ON c.id = d.circuit_id AND d.status = 'confirmed'
            LEFT JOIN proofs p ON c.id = p.circuit_id
            LEFT JOIN proof_artifacts pa ON c.id = pa.circuit_id
            WHERE c.created_by = $1 OR d.deployed_by_address = $1 OR p.created_by = $1
            ORDER BY c.created_at DESC
            "#,
            user_address
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(circuits)
    }

    /// Get all public circuits with confirmed deployments.
    pub async fn get_public_circuits(&self) -> Result<Vec<CircuitWithDeployment>, Error> {
        let circuits = sqlx::query_as!(
            CircuitWithDeployment,
            r#"
            SELECT DISTINCT
                c.id, c.hash, c.name, c.description, c.code,
                c.circuit_type as "circuit_type: _",
                c.created_by, c.is_public, c.created_at,
                d.contract_address as deployed_address,
                d.deployment_type as "deployment_type?: DeploymentType",
                pa.input_signals,
                pa.input_descriptions
            FROM circuits c
            JOIN deployments d ON c.id = d.circuit_id AND d.status = 'confirmed'
            LEFT JOIN proof_artifacts pa ON c.id = pa.circuit_id
            WHERE c.is_public = true
            ORDER BY c.created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(circuits)
    }

    /// Get platform-wide statistics for the home page hero
    pub async fn get_platform_stats(&self) -> Result<PlatformStats, Error> {
        let proofs_count = sqlx::query_scalar!(r#"SELECT COUNT(*) as "count!" FROM proofs"#)
            .fetch_one(&self.pool)
            .await?;

        let circuits_count = sqlx::query_scalar!(
            r#"SELECT COUNT(*) as "count!" FROM circuits WHERE is_public = true"#
        )
        .fetch_one(&self.pool)
        .await?;

        let verified_proofs = sqlx::query_scalar!(
            r#"SELECT COUNT(*) as "count!" FROM proofs WHERE verification_status = 'verified'"#
        )
        .fetch_one(&self.pool)
        .await?;

        let deployments_count = sqlx::query_scalar!(
            r#"SELECT COUNT(*) as "count!" FROM deployments WHERE status = 'confirmed'"#
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(PlatformStats {
            total_proofs: proofs_count,
            active_circuits: circuits_count,
            verified_proofs,
            deployments: deployments_count,
        })
    }

    /// Get proofs created by a user
    pub async fn get_user_proofs(
        &self,
        user_address: &str,
    ) -> Result<Vec<ProofWithCircuit>, Error> {
        let proofs = sqlx::query_as!(
            ProofWithCircuit,
            r#"
            SELECT 
                p.id, p.circuit_id, 
                p.proof_data as "proof_data!",
                p.public_inputs as "public_inputs!",
                p.calldata, p.tx_hash, p.tx_status,
                p.verification_status as "verification_status: ProofVerificationStatus",
                p.shared_token, p.created_at,
                c.name as circuit_name, c.hash as circuit_hash
            FROM proofs p
            JOIN circuits c ON p.circuit_id = c.id
            WHERE p.created_by = $1
            ORDER BY p.created_at DESC
            "#,
            user_address
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(proofs)
    }

    /// Get deployments by a user
    pub async fn get_user_deployments(
        &self,
        user_address: &str,
    ) -> Result<Vec<DeploymentWithCircuit>, Error> {
        let deployments = sqlx::query_as!(
            DeploymentWithCircuit,
            r#"
            SELECT 
                d.id, d.circuit_id, 
                d.deployment_type as "deployment_type: DeploymentType",
                d.deployed_by_address, d.tx_hash, d.contract_address,
                d.class_hash, d.available_endpoints,
                d.status as "status: DeploymentStatus",
                d.created_at,
                c.name as circuit_name, c.hash as circuit_hash,
                c.circuit_type as "circuit_type: CircuitType"
            FROM deployments d
            JOIN circuits c ON d.circuit_id = c.id
            WHERE d.deployed_by_address = $1 AND d.status = 'confirmed'
            ORDER BY d.created_at DESC
            "#,
            user_address
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(deployments)
    }

    /// Generate or return an existing unique share token for a proof.
    /// If the proof already has a shared_token, return it (stable URLs).
    pub async fn generate_proof_share_token(&self, proof_id: i32) -> Result<String, Error> {
        // Check if a token already exists for this proof
        let existing =
            sqlx::query_scalar!(r#"SELECT shared_token FROM proofs WHERE id = $1"#, proof_id)
                .fetch_one(&self.pool)
                .await?;

        if let Some(token) = existing {
            // Return the existing token for stable URLs
            return Ok(token);
        }

        use rand::Rng;
        use rand::distributions::Alphanumeric;

        // Generate a random 32-character token
        let token: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect();

        // Update the proof with the share token
        sqlx::query!(
            r#"
            UPDATE proofs
            SET shared_token = $1
            WHERE id = $2
            "#,
            token,
            proof_id
        )
        .execute(&self.pool)
        .await?;

        Ok(token)
    }

    /// Get proof by share token (public access)
    pub async fn get_proof_by_share_token(&self, token: &str) -> Result<ProofDetails, Error> {
        let proof = sqlx::query_as!(
            ProofDetails,
            r#"
            SELECT 
                p.id, p.circuit_id,
                p.proof_data as "proof_data!",
                p.public_inputs as "public_inputs!",
                p.calldata,
                p.tx_hash, p.verification_status as "verification_status: ProofVerificationStatus",
                p.created_at,
                c.name as circuit_name, c.hash as circuit_hash,
                c.circuit_type as "circuit_type: CircuitType",
                c.description as circuit_description,
                d.contract_address as verifier_address,
                d.deployed_by_address,
                p.created_by as prover_address,
                pa.output_signals,
                pa.public_input_signals,
                pa.output_descriptions,
                pa.public_input_descriptions,
                pa.input_descriptions
            FROM proofs p
            JOIN circuits c ON p.circuit_id = c.id
            LEFT JOIN deployments d ON c.id = d.circuit_id AND d.status = 'confirmed'
            LEFT JOIN proof_artifacts pa ON c.id = pa.circuit_id
            WHERE p.shared_token = $1
            ORDER BY d.created_at DESC
            LIMIT 1
            "#,
            token
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(proof)
    }

    /// Update the description of a circuit by ID.
    pub async fn update_circuit_description(
        &self,
        id: i32,
        description: &str,
    ) -> Result<(), Error> {
        sqlx::query!(
            r#"UPDATE circuits SET description = $1 WHERE id = $2"#,
            description,
            id,
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    /// Get all circuit templates (created_by IS NULL, has source_path).
    pub async fn get_circuits(&self) -> Result<Vec<CircuitTemplate>, Error> {
        let templates = sqlx::query_as!(
            CircuitTemplate,
            r#"
            SELECT id, hash, name, description, code, source_path,
                   circuit_type as "circuit_type: CircuitType",
                   created_at
            FROM circuits
            WHERE created_by IS NULL AND source_path IS NOT NULL
            ORDER BY name ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(templates)
    }
}

// Additional structs for complex queries
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct CircuitWithDeployment {
    pub id: i32,
    pub hash: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub code: Option<String>,
    pub circuit_type: CircuitType,
    pub created_by: Option<String>,
    pub is_public: Option<bool>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub deployed_address: Option<String>,
    pub deployment_type: Option<DeploymentType>,
    pub input_signals: Option<Vec<String>>,
    pub input_descriptions: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformStats {
    pub total_proofs: i64,
    pub active_circuits: i64,
    pub verified_proofs: i64,
    pub deployments: i64,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ProofWithCircuit {
    pub id: i32,
    pub circuit_id: i32,
    pub proof_data: serde_json::Value,
    pub public_inputs: serde_json::Value,
    pub calldata: Option<String>,
    pub tx_hash: Option<String>,
    pub tx_status: Option<String>,
    pub verification_status: ProofVerificationStatus,
    pub shared_token: Option<String>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub circuit_name: Option<String>,
    pub circuit_hash: String,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DeploymentWithCircuit {
    pub id: i32,
    pub circuit_id: i32,
    pub deployment_type: DeploymentType,
    pub deployed_by_address: Option<String>,
    pub tx_hash: Option<String>,
    pub contract_address: Option<String>,
    pub class_hash: Option<String>,
    pub available_endpoints: Option<Vec<String>>,
    pub status: DeploymentStatus,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub circuit_name: Option<String>,
    pub circuit_hash: String,
    pub circuit_type: CircuitType,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ProofDetails {
    pub id: i32,
    pub circuit_id: i32,
    pub proof_data: serde_json::Value,
    pub public_inputs: serde_json::Value,
    pub calldata: Option<String>,
    pub tx_hash: Option<String>,
    pub verification_status: ProofVerificationStatus,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub circuit_name: Option<String>,
    pub circuit_hash: String,
    pub circuit_type: CircuitType,
    pub verifier_address: Option<String>,
    pub circuit_description: Option<String>,
    pub deployed_by_address: Option<String>,
    pub prover_address: Option<String>,
    pub output_signals: Option<Vec<String>>,
    pub public_input_signals: Option<Vec<String>>,
    pub output_descriptions: Option<serde_json::Value>,
    pub public_input_descriptions: Option<serde_json::Value>,
    pub input_descriptions: Option<serde_json::Value>,
}

#[derive(sqlx::Type, Debug, Clone, Serialize, Deserialize)]
#[sqlx(type_name = "proof_verification_status_", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ProofVerificationStatus {
    Pending,
    Verified,
    Failed,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct CircuitTemplate {
    pub id: i32,
    pub hash: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub code: Option<String>,
    pub source_path: Option<String>,
    pub circuit_type: CircuitType,
    pub created_at: Option<chrono::NaiveDateTime>,
}
