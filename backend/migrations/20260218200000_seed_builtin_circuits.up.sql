-- Seed 9 built-in circuit templates.
-- Uses ON CONFLICT to be idempotent (safe to run multiple times).

-- 1. Hash Preimage (Poseidon)
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_hash_preimage_poseidon',
    'Hash Preimage (Poseidon)',
    'This proof demonstrates that the prover knows a secret value whose Poseidon hash equals a publicly known commitment, without revealing the secret itself.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\n\ntemplate HashPreimage() {\n    signal input secret;       // private\n    signal input commitment;   // public\n\n    component hasher = Poseidon(1);\n    hasher.inputs[0] <== secret;\n\n    commitment === hasher.out;\n}\n\ncomponent main {public [commitment]} = HashPreimage();\n',
    'circom', true, NULL, 'builtin/hash_preimage_poseidon.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 2. Merkle Proof (Poseidon, 8 levels)
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_merkle_proof',
    'Merkle Proof',
    'This proof demonstrates that the prover knows a leaf value and a valid Merkle path that hashes up to a publicly known root, proving membership in a set without revealing which leaf.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\n\ntemplate MerkleProof(levels) {\n    signal input leaf;\n    signal input pathElements[levels];\n    signal input pathIndices[levels];\n    signal input root;\n\n    component hashers[levels];\n    signal hashes[levels + 1];\n    hashes[0] <== leaf;\n\n    for (var i = 0; i < levels; i++) {\n        hashers[i] = Poseidon(2);\n\n        // pathIndices[i] must be 0 or 1\n        pathIndices[i] * (1 - pathIndices[i]) === 0;\n\n        // If index=0, hash(current, sibling). If index=1, hash(sibling, current).\n        hashers[i].inputs[0] <== hashes[i] + pathIndices[i] * (pathElements[i] - hashes[i]);\n        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (hashes[i] - pathElements[i]);\n\n        hashes[i + 1] <== hashers[i].out;\n    }\n\n    root === hashes[levels];\n}\n\ncomponent main {public [root]} = MerkleProof(8);\n',
    'circom', true, NULL, 'builtin/merkle_proof.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 3. Nullifier
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_nullifier',
    'Nullifier',
    'This proof demonstrates that the prover knows a secret and produces a unique nullifier hash tied to a public context, enabling anonymous actions with double-spend prevention.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\n\ntemplate Nullifier() {\n    signal input secret;\n    signal input externalNullifier;\n    signal output commitment;\n    signal output nullifierHash;\n\n    component commitHasher = Poseidon(1);\n    commitHasher.inputs[0] <== secret;\n    commitment <== commitHasher.out;\n\n    component nullHasher = Poseidon(2);\n    nullHasher.inputs[0] <== secret;\n    nullHasher.inputs[1] <== externalNullifier;\n    nullifierHash <== nullHasher.out;\n}\n\ncomponent main {public [externalNullifier]} = Nullifier();\n',
    'circom', true, NULL, 'builtin/nullifier.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 4. Private Vote (4 choices)
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_private_vote',
    'Private Vote',
    'This proof demonstrates that the prover cast a valid vote for one of the allowed choices in an election, producing a vote commitment and a nullifier to prevent double voting, without revealing the choice.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\ninclude "circomlib/circuits/bitify.circom";\n\ntemplate PrivateVote(numChoices) {\n    signal input voterSecret;\n    signal input choice;\n    signal input electionId;\n    signal output voteCommitment;\n    signal output nullifier;\n\n    // Choice must be valid (0 to numChoices-1)\n    component bits = Num2Bits(8);\n    bits.in <== choice;\n    signal rangeCheck;\n    rangeCheck <== numChoices - 1 - choice;\n    component rangeBits = Num2Bits(8);\n    rangeBits.in <== rangeCheck;\n\n    // Vote commitment (binds voter + choice + election)\n    component commitHasher = Poseidon(3);\n    commitHasher.inputs[0] <== voterSecret;\n    commitHasher.inputs[1] <== choice;\n    commitHasher.inputs[2] <== electionId;\n    voteCommitment <== commitHasher.out;\n\n    // Nullifier prevents double voting\n    component nullHasher = Poseidon(2);\n    nullHasher.inputs[0] <== voterSecret;\n    nullHasher.inputs[1] <== electionId;\n    nullifier <== nullHasher.out;\n}\n\ncomponent main {public [electionId]} = PrivateVote(4);\n',
    'circom', true, NULL, 'builtin/private_vote.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 5. Credit Score Range
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_credit_score_range',
    'Credit Score Range',
    'This proof demonstrates that the prover has a committed credit score falling within a publicly specified range, without revealing the exact score.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\ninclude "circomlib/circuits/bitify.circom";\n\ntemplate CreditScoreRange() {\n    signal input score;\n    signal input salt;\n    signal input commitment;\n    signal input minScore;\n    signal input maxScore;\n\n    // Verify commitment\n    component hasher = Poseidon(2);\n    hasher.inputs[0] <== score;\n    hasher.inputs[1] <== salt;\n    commitment === hasher.out;\n\n    // Prove score >= minScore\n    signal lowerDiff;\n    lowerDiff <== score - minScore;\n    component lowerBits = Num2Bits(16);\n    lowerBits.in <== lowerDiff;\n\n    // Prove score <= maxScore\n    signal upperDiff;\n    upperDiff <== maxScore - score;\n    component upperBits = Num2Bits(16);\n    upperBits.in <== upperDiff;\n}\n\ncomponent main {public [commitment, minScore, maxScore]} = CreditScoreRange();\n',
    'circom', true, NULL, 'builtin/credit_score_range.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 6. Private Transfer
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_private_transfer',
    'Private Transfer',
    'This proof demonstrates that the prover owns a committed balance and is transferring a valid positive amount that does not exceed that balance, without revealing the balance or the transfer amount.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\ninclude "circomlib/circuits/bitify.circom";\n\ntemplate PrivateTransfer() {\n    signal input amount;\n    signal input senderBalance;\n    signal input senderSecret;\n    signal input senderCommitment;\n    signal input recipientPubkey;\n\n    // 1. Verify sender owns the balance\n    component commitCheck = Poseidon(2);\n    commitCheck.inputs[0] <== senderBalance;\n    commitCheck.inputs[1] <== senderSecret;\n    senderCommitment === commitCheck.out;\n\n    // 2. Prove amount <= senderBalance (non-negative difference)\n    signal diff;\n    diff <== senderBalance - amount;\n    component rangeCheck = Num2Bits(64);\n    rangeCheck.in <== diff;\n\n    // 3. Prove amount > 0\n    signal amountMinusOne;\n    amountMinusOne <== amount - 1;\n    component posCheck = Num2Bits(64);\n    posCheck.in <== amountMinusOne;\n}\n\ncomponent main {public [senderCommitment, recipientPubkey]} = PrivateTransfer();\n',
    'circom', true, NULL, 'builtin/private_transfer.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 7. Balance Threshold
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_balance_threshold',
    'Balance Threshold',
    'This proof demonstrates that the prover knows a private balance that meets or exceeds a publicly specified threshold, without revealing the exact balance.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/bitify.circom";\n\ntemplate BalanceThreshold(n) {\n    signal input balance;\n    signal input threshold;\n    signal output sufficient;\n\n    signal diff;\n    diff <== balance - threshold;\n\n    // Prove diff fits in n bits (non-negative)\n    component bits = Num2Bits(n);\n    bits.in <== diff;\n\n    sufficient <== 1;\n}\n\ncomponent main {public [threshold]} = BalanceThreshold(64);\n',
    'circom', true, NULL, 'builtin/balance_threshold.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 8. Age Verification
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_age_verification',
    'Age Verification',
    'This proof demonstrates that the prover''s age, derived from a private birth year and a public current year, meets or exceeds the required minimum age, without revealing the birth year.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/bitify.circom";\n\ntemplate AgeVerification(minAge) {\n    signal input age;\n    signal input currentYear;\n    signal input birthYear;\n    signal output valid;\n\n    // Prove age = currentYear - birthYear\n    age === currentYear - birthYear;\n\n    // Prove age >= minAge\n    signal diff;\n    diff <== age - minAge;\n\n    component rangeCheck = Num2Bits(8);\n    rangeCheck.in <== diff;\n\n    valid <== 1;\n}\n\ncomponent main {public [currentYear]} = AgeVerification(18);\n',
    'circom', true, NULL, 'builtin/age_verification.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 9. EdDSA Signature Verification
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'builtin_eddsa_signature',
    'EdDSA Signature Verification',
    'This proof demonstrates that the prover knows a valid EdDSA signature over a public message that corresponds to a publicly known public key, without revealing the signature components.',
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/eddsamimc.circom";\n\ntemplate SignatureProof() {\n    signal input msg;\n    signal input pubKeyX;\n    signal input pubKeyY;\n    signal input R8x;\n    signal input R8y;\n    signal input S;\n\n    component verifier = EdDSAMiMCVerifier();\n    verifier.enabled <== 1;\n    verifier.Ax <== pubKeyX;\n    verifier.Ay <== pubKeyY;\n    verifier.R8x <== R8x;\n    verifier.R8y <== R8y;\n    verifier.S <== S;\n    verifier.M <== msg;\n}\n\ncomponent main {public [msg, pubKeyX, pubKeyY]} = SignatureProof();\n',
    'circom', true, NULL, 'builtin/eddsa_signature.circom'
) ON CONFLICT (hash) DO NOTHING;
