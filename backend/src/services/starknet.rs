//! Starknet contract declaration service.
//!
//! Encapsulates the logic for declaring a Sierra/CASM contract class
//! on Starknet using the server's deployer account.

use std::sync::Arc;

use starknet_rust::accounts::{Account, ExecutionEncoding, SingleOwnerAccount};
use starknet_rust::core::{
    chain_id,
    types::{
        Felt,
        contract::{CompiledClass, SierraClass},
    },
};
use starknet_rust::providers::{
    Provider, Url,
    jsonrpc::{HttpTransport, JsonRpcClient},
};
use starknet_rust::signers::{LocalWallet, SigningKey};
use tracing::{error, info};

/// Declare a contract class on Starknet using the server's deployer account.
///
/// Takes the Sierra and CASM JSON strings (from scarb build output) and
/// returns the class_hash as a hex string.
///
/// If the class is already declared, the class hash is computed locally and
/// returned without sending a transaction.
pub async fn declare_contract_class(sierra_json: &str, casm_json: &str) -> Result<String, String> {
    let rpc_url =
        std::env::var("SEPOLIA_RPC_URL").map_err(|_| "SEPOLIA_RPC_URL not set".to_string())?;
    let rpc_url = rpc_url.trim_matches('"').to_string();
    let private_key = std::env::var("SEPOLIA_ACCOUNT_PRIVATE_KEY")
        .map_err(|_| "SEPOLIA_ACCOUNT_PRIVATE_KEY not set".to_string())?;
    let account_address = std::env::var("SEPOLIA_ACCOUNT_ADDRESS")
        .map_err(|_| "SEPOLIA_ACCOUNT_ADDRESS not set".to_string())?;

    info!("Declaring contract class via server deployer account");

    let sierra_class: SierraClass = serde_json::from_str(sierra_json)
        .map_err(|e| format!("Failed to parse Sierra class: {}", e))?;
    let compiled_class: CompiledClass = serde_json::from_str(casm_json)
        .map_err(|e| format!("Failed to parse CASM class: {}", e))?;
    let compiled_class_hash = compiled_class
        .class_hash()
        .map_err(|e| format!("Failed to compute compiled class hash: {}", e))?;

    let flattened_class = sierra_class
        .flatten()
        .map_err(|e| format!("Failed to flatten Sierra class: {}", e))?;

    let class_hash = flattened_class.class_hash();
    let class_hash_hex = format!("{:#066x}", class_hash);
    info!("Computed class hash: {}", class_hash_hex);
    info!(
        "Computed compiled class hash: {:#066x}",
        compiled_class_hash
    );

    // Create provider
    let provider = JsonRpcClient::new(HttpTransport::new(
        Url::parse(&rpc_url).map_err(|e| format!("Invalid RPC URL: {}", e))?,
    ));

    // Check if class is already declared on-chain
    match provider
        .get_class(
            starknet_rust::core::types::BlockId::Tag(starknet_rust::core::types::BlockTag::Latest),
            class_hash,
        )
        .await
    {
        Ok(_) => {
            info!(
                "Contract class already declared on-chain: {}",
                class_hash_hex
            );
            return Ok(class_hash_hex);
        }
        Err(_) => {
            info!("Class not yet declared, proceeding with declaration");
        }
    }

    // Create signer and account
    let signer = LocalWallet::from(SigningKey::from_secret_scalar(
        Felt::from_hex(&private_key).map_err(|e| format!("Invalid private key: {}", e))?,
    ));
    let address =
        Felt::from_hex(&account_address).map_err(|e| format!("Invalid account address: {}", e))?;

    let account = SingleOwnerAccount::new(
        &provider,
        signer,
        address,
        chain_id::SEPOLIA,
        ExecutionEncoding::New,
    );

    info!("Sending declare_v3 transaction...");
    let result = account
        .declare_v3(Arc::new(flattened_class), compiled_class_hash)
        .send()
        .await;

    match result {
        Ok(declare_result) => {
            let tx_hash = format!("{:#066x}", declare_result.transaction_hash);
            let class_hash = format!("{:#066x}", declare_result.class_hash);
            info!(
                "Contract declared successfully! tx_hash: {}, class_hash: {}",
                tx_hash, class_hash
            );

            info!("Waiting for declare transaction to be accepted...");
            let max_retries = 60; // ~60 seconds max
            let mut confirmed = false;
            for attempt in 1..=max_retries {
                match provider
                    .get_transaction_receipt(declare_result.transaction_hash)
                    .await
                {
                    Ok(_receipt) => {
                        info!("Declare transaction confirmed after {} attempts", attempt);
                        confirmed = true;
                        break;
                    }
                    Err(_) => {
                        if attempt % 10 == 0 {
                            info!(
                                "Still waiting for declare tx confirmation (attempt {}/{})",
                                attempt, max_retries
                            );
                        }
                        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                    }
                }
            }

            if !confirmed {
                error!(
                    "Declare transaction not confirmed after {} seconds",
                    max_retries
                );
                return Err(
                    "Declare transaction submitted but not confirmed within timeout. \
                     Please retry — the class may already be declared."
                        .to_string(),
                );
            }

            info!("Verifying class is available via get_class...");
            let mut class_available = false;
            for attempt in 1..=10 {
                match provider
                    .get_class(
                        starknet_rust::core::types::BlockId::Tag(
                            starknet_rust::core::types::BlockTag::Latest,
                        ),
                        declare_result.class_hash,
                    )
                    .await
                {
                    Ok(_) => {
                        info!("Class verified available after {} attempts", attempt);
                        class_available = true;
                        break;
                    }
                    Err(_) => {
                        info!(
                            "Class not yet available via get_class (attempt {}/10)",
                            attempt
                        );
                        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                    }
                }
            }

            if !class_available {
                error!("Class not available via get_class after transaction confirmed");
                return Err("Class declaration confirmed but class not yet available. \
                     Please wait a moment and try again."
                    .to_string());
            }

            Ok(class_hash)
        }
        Err(e) => {
            let err_str = format!("{}", e);
            if err_str.contains("already declared") || err_str.contains("CLASS_ALREADY_DECLARED") {
                info!(
                    "Contract class already declared (caught from error): {}",
                    class_hash_hex
                );
                Ok(class_hash_hex)
            } else {
                error!("Failed to declare contract: {}", err_str);
                Err(format!(
                    "Failed to declare contract on Starknet: {}",
                    err_str
                ))
            }
        }
    }
}
