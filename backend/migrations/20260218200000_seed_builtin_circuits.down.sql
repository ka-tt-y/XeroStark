-- Remove the 9 built-in seed circuits
DELETE FROM circuits WHERE hash IN (
    'builtin_hash_preimage_poseidon',
    'builtin_merkle_proof',
    'builtin_nullifier',
    'builtin_private_vote',
    'builtin_credit_score_range',
    'builtin_private_transfer',
    'builtin_balance_threshold',
    'builtin_age_verification',
    'builtin_eddsa_signature',
    'builtin_credit_score_range_simple',
    'builtin_private_transfer_simple',
    'builtin_age_verification_accurate'
);
