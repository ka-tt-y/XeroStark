
-- 1. Hash Preimage (Poseidon)
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    '4aadf3ec4b142ba2bff2d9c904ad97f3349947836701942f02c8a776de4f17e4',
    'Hash Preimage (Poseidon)',
    NULL,
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\n\ntemplate HashPreimage() {\n    signal input secret;       // private: your secret value\n    signal input commitment;   // public: the hash to verify against\n\n    component hasher = Poseidon(1);\n    hasher.inputs[0] <== secret;\n\n    commitment === hasher.out;\n}\n\ncomponent main {public [commitment]} = HashPreimage();\n',
    'circom', true, NULL, 'hash_preimage_poseidon.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 2. Merkle Proof (Poseidon, 8 levels) - Prove membership in a set
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'd6ba32fe96e85d3e43308eaac18809382df81133a0cfd4ac6de97b073164c6f7',
    'Merkle Proof',
    NULL,
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\n\ntemplate MerkleProof(levels) {\n    signal input leaf;\n    signal input pathElements[levels];\n    signal input pathIndices[levels];\n    signal input root;\n\n    component hashers[levels];\n    signal hashes[levels + 1];\n    hashes[0] <== leaf;\n\n    for (var i = 0; i < levels; i++) {\n        hashers[i] = Poseidon(2);\n\n        // pathIndices[i] must be 0 or 1\n        pathIndices[i] * (1 - pathIndices[i]) === 0;\n\n        // If index=0, hash(current, sibling). If index=1, hash(sibling, current).\n        hashers[i].inputs[0] <== hashes[i] + pathIndices[i] * (pathElements[i] - hashes[i]);\n        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (hashes[i] - pathElements[i]);\n\n        hashes[i + 1] <== hashers[i].out;\n    }\n\n    root === hashes[levels];\n}\n\ncomponent main {public [root]} = MerkleProof(8);\n',
    'circom', true, NULL, 'merkle_proof.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 3. Balance Threshold - Prove you have enough funds
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    'b679dd6d6ac9c9232a9acc432e900234c175a79584af1945ee59170d981308ce',
    'Balance Threshold',
    NULL,
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/bitify.circom";\n\ntemplate BalanceThreshold(n) {\n    signal input balance;    // private: your actual balance\n    signal input threshold;  // public: minimum required\n    signal output sufficient;\n\n    signal diff;\n    diff <== balance - threshold;\n\n    // Prove diff fits in n bits (non-negative)\n    component bits = Num2Bits(n);\n    bits.in <== diff;\n\n    sufficient <== 1;\n}\n\ncomponent main {public [threshold]} = BalanceThreshold(64);\n',
    'circom', true, NULL, 'balance_threshold.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 4. Age Verification
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    '25aa0051febce648f201cf50e91c77f3e9bcef64a2bb4c24c442e29f7ba3eac8',
    'Age Verification',
    NULL,
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/bitify.circom";\n\ntemplate AgeVerification(minAge) {\n    // Private inputs - your birth date\n    signal input birthDay;\n    signal input birthMonth;\n    signal input birthYear;\n    \n    // Public inputs - current date\n    signal input currentDay;\n    signal input currentMonth;\n    signal input currentYear;\n    \n    signal output isOldEnough;\n\n    // Calculate base age from years\n    signal yearDiff;\n    yearDiff <== currentYear - birthYear;\n\n    // Check if birthday has passed this year\n    // monthDiff = currentMonth - birthMonth (can be negative)\n    signal monthDiff;\n    monthDiff <== currentMonth - birthMonth;\n    \n    // dayDiff = currentDay - birthDay (can be negative)\n    signal dayDiff;\n    dayDiff <== currentDay - birthDay;\n\n    // If birthday hasn''t occurred yet, subtract 1 from age\n    // birthdayPassed = 1 if (monthDiff > 0) OR (monthDiff == 0 AND dayDiff >= 0)\n    signal monthPositive;\n    signal monthZeroAndDayOk;\n    \n    // Simplified: assume the difference is within valid range\n    // For full accuracy, a more complex circuit would be needed\n    // This version checks yearDiff >= minAge (simpler approximation)\n    signal ageDiff;\n    ageDiff <== yearDiff - minAge;\n    \n    component rangeCheck = Num2Bits(8);\n    rangeCheck.in <== ageDiff;\n\n    isOldEnough <== 1;\n}\n\ncomponent main {public [currentDay, currentMonth, currentYear]} = AgeVerification(18);\n',
    'circom', true, NULL, 'age_verification.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 5. Password Verification - takes raw password, hashes it inside the circuit
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    '7fcbaf0140ad8ded2476dd87e7c3c9f2c5ddaebd8a235677b1d1cc53b3f89359',
    'Password Verification',
    NULL,
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/poseidon.circom";\n\ntemplate PasswordVerification() {\n    // Private: your secret password (as a number)\n    signal input password;\n    // Public: the stored password hash to verify against\n    signal input storedHash;\n    // Public: a unique identifier (prevents replay attacks)\n    signal input nonce;\n    \n    signal output valid;\n\n    // Hash the password using Poseidon\n    component hasher = Poseidon(1);\n    hasher.inputs[0] <== password;\n\n    // Verify the computed hash matches the stored hash\n    hasher.out === storedHash;\n\n    // Include nonce in output to bind proof to this session\n    component nonceHasher = Poseidon(2);\n    nonceHasher.inputs[0] <== hasher.out;\n    nonceHasher.inputs[1] <== nonce;\n    \n    valid <== 1;\n}\n\ncomponent main {public [storedHash, nonce]} = PasswordVerification();\n',
    'circom', true, NULL, 'password_verification.circom'
) ON CONFLICT (hash) DO NOTHING;

-- 6. Number in Range - Prove a number is within bounds
INSERT INTO circuits (hash, name, description, code, circuit_type, is_public, created_by, source_path)
VALUES (
    '857056a717921c5936bd42b7f1b674dee7c00c34b6be149326ac54494469b624',
    'Number in Range',
    NULL,
    E'pragma circom 2.0.0;\n\ninclude "circomlib/circuits/bitify.circom";\n\ntemplate NumberInRange(bits) {\n    // Private: your secret number\n    signal input value;\n    // Public: the allowed range\n    signal input minValue;\n    signal input maxValue;\n    \n    signal output inRange;\n\n    // Prove value >= minValue\n    signal lowerDiff;\n    lowerDiff <== value - minValue;\n    component lowerBits = Num2Bits(bits);\n    lowerBits.in <== lowerDiff;\n\n    // Prove value <= maxValue  \n    signal upperDiff;\n    upperDiff <== maxValue - value;\n    component upperBits = Num2Bits(bits);\n    upperBits.in <== upperDiff;\n\n    inRange <== 1;\n}\n\ncomponent main {public [minValue, maxValue]} = NumberInRange(64);\n',
    'circom', true, NULL, 'number_range.circom'
) ON CONFLICT (hash) DO NOTHING;
