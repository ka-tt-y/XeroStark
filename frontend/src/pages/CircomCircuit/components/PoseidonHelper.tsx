import React, { useState, useCallback } from 'react';

// Lazy-load poseidon-lite to avoid blocking initial render
let _poseidon1: ((inputs: bigint[]) => bigint) | null = null;
let _poseidon2: ((inputs: bigint[]) => bigint) | null = null;

async function loadPoseidon() {
	if (!_poseidon1) {
		const mod = await import('poseidon-lite');
		_poseidon1 = mod.poseidon1;
		_poseidon2 = mod.poseidon2;
	}
	return { poseidon1: _poseidon1!, poseidon2: _poseidon2! };
}

const PoseidonHelper: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'single' | 'password' | 'merkle'>('single');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState<string | null>(null);

	// Single hash
	const [secretValue, setSecretValue] = useState('');
	const [singleResult, setSingleResult] = useState<string | null>(null);

	// Password hash
	const [password, setPassword] = useState('');
	const [salt, setSalt] = useState('');
	const [passwordResult, setPasswordResult] = useState<{
		num: string;
		salt: string;
		hash: string;
	} | null>(null);

	// Merkle tree
	const [leaves, setLeaves] = useState('');
	const [leafIndex, setLeafIndex] = useState('0');
	const [merkleResult, setMerkleResult] = useState<{
		root: string;
		leaf: string;
		path: string[];
		indices: number[];
	} | null>(null);

	const copyToClipboard = async (text: string, key: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(key);
			setTimeout(() => setCopied(null), 1500);
		} catch { /* ignore */ }
	};

	const handleHashSingle = useCallback(async () => {
		try {
			setError(null);
			if (!secretValue.trim()) { setError('Please enter a number.'); return; }
			setLoading(true);
			const { poseidon1 } = await loadPoseidon();
			const val = BigInt(secretValue.trim());
			const hash = poseidon1([val]);
			setSingleResult(hash.toString());
		} catch {
			setError('Invalid number. Please enter a valid integer.');
		} finally {
			setLoading(false);
		}
	}, [secretValue]);

	const handleHashPassword = useCallback(async () => {
		try {
			setError(null);
			if (!password) { setError('Please enter a password.'); return; }
			setLoading(true);
			const { poseidon2 } = await loadPoseidon();

			// Convert password to a big number
			let passwordNum = 0n;
			for (let i = 0; i < password.length; i++) {
				passwordNum = passwordNum * 256n + BigInt(password.charCodeAt(i));
			}
			passwordNum = passwordNum % (2n ** 253n);

			const saltVal = salt.trim() || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
			const hash = poseidon2([passwordNum, BigInt(saltVal)]);

			setPasswordResult({
				num: passwordNum.toString(),
				salt: saltVal,
				hash: hash.toString(),
			});
		} catch {
			setError('Invalid input. Salt must be a valid number.');
		} finally {
			setLoading(false);
		}
	}, [password, salt]);

	const handleBuildMerkle = useCallback(async () => {
		try {
			setError(null);
			if (!leaves.trim()) { setError('Please enter at least one value.'); return; }
			setLoading(true);
			const { poseidon1, poseidon2 } = await loadPoseidon();

			const lines = leaves.split('\n').map(l => l.trim()).filter(l => l);
			const idx = parseInt(leafIndex);
			if (isNaN(idx) || idx < 0 || idx >= lines.length) {
				setError(`Invalid position. Must be 0 to ${lines.length - 1}.`);
				setLoading(false);
				return;
			}

			// Hash each leaf
			let level: bigint[] = lines.map(l => poseidon1([BigInt(l)]));

			// Pad to next power of 2 (max 8 levels = 256 leaves)
			const levels = 8;
			const targetSize = Math.pow(2, levels);
			while (level.length < targetSize) {
				level.push(poseidon1([0n]));
			}

			const pathElements: string[] = [];
			const pathIndices: number[] = [];
			let currentIndex = idx;

			for (let lv = 0; lv < levels; lv++) {
				const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
				pathElements.push(level[siblingIndex].toString());
				pathIndices.push(currentIndex % 2);

				const nextLevel: bigint[] = [];
				for (let i = 0; i < level.length; i += 2) {
					nextLevel.push(poseidon2([level[i], level[i + 1]]));
				}
				level = nextLevel;
				currentIndex = Math.floor(currentIndex / 2);
			}

			setMerkleResult({
				root: level[0].toString(),
				leaf: lines[idx],
				path: pathElements,
				indices: pathIndices,
			});
		} catch {
			setError('Error building tree. All values must be valid integers.');
		} finally {
			setLoading(false);
		}
	}, [leaves, leafIndex]);

	const tabs = [
		{ id: 'single' as const, label: 'Hash a Value', icon: '#️⃣' },
		{ id: 'password' as const, label: 'Password Hash', icon: '🔑' },
		{ id: 'merkle' as const, label: 'Merkle Tree', icon: '🌳' },
	];

	const ResultBox: React.FC<{ label: string; value: string; copyKey: string; isPrivate?: boolean }> = ({
		label, value, copyKey, isPrivate,
	}) => (
		<div className={`p-3 rounded-lg border mt-3 ${
			isPrivate
				? 'bg-yellow-500/5 border-yellow-500/20'
				: 'bg-green-500/5 border-green-500/20'
		}`}>
			<div className="flex items-center justify-between mb-1">
				<span className={`text-xs font-medium ${isPrivate ? 'text-yellow-400' : 'text-green-400'}`}>
					{label} {isPrivate && '(keep private)'}
				</span>
				<button
					onClick={() => copyToClipboard(value, copyKey)}
					className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded border border-gray-700 hover:border-gray-500"
				>
					{copied === copyKey ? '✓ Copied' : '📋 Copy'}
				</button>
			</div>
			<p className="font-mono text-sm text-white break-all select-all">{value}</p>
		</div>
	);

	return (
		<div className="card p-0 overflow-hidden mt-6">
			{/* Header — clickable to toggle */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-6 py-4 border-b border-gray-700 bg-purple-500/10 text-left hover:bg-purple-500/15 transition-colors cursor-pointer"
			>
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
						<span className="text-lg">🔐</span>
					</div>
					<div className="flex-1">
						<h3 className="font-semibold text-white">Poseidon Hash Helper</h3>
						<p className="text-xs text-gray-400 mt-0.5">
							This circuit uses Poseidon hashing. Use the tools below to compute hash values for your inputs.
						</p>
					</div>
					<span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
						▼
					</span>
				</div>
			</button>

			{!isOpen ? null : (<>

			{/* Tabs */}
			<div className="flex border-b border-gray-700">
				{tabs.map(tab => (
					<button
						key={tab.id}
						onClick={() => { setActiveTab(tab.id); setError(null); }}
						className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
							activeTab === tab.id
								? 'text-purple-300 border-b-2 border-purple-400 bg-purple-500/5'
								: 'text-gray-500 hover:text-gray-300 hover:bg-dark-800/50'
						}`}
					>
						<span className="mr-1.5">{tab.icon}</span>
						{tab.label}
					</button>
				))}
			</div>

			<div className="p-6">
				{/* Error */}
				{error && (
					<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
						<p className="text-sm text-red-400">{error}</p>
					</div>
				)}

				{/* ── Single Value Hash ── */}
				{activeTab === 'single' && (
					<div>
						<div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 mb-5">
							<p className="text-sm text-gray-400 leading-relaxed">
								<span className="text-blue-400 font-medium">ℹ️ How it works:</span> Enter any secret number. You'll get a "commitment" (hash) to share publicly. Keep your secret private — use it when generating proofs.
							</p>
						</div>

						<label className="block text-sm font-medium text-gray-300 mb-2">Your Secret Number</label>
						<input
							type="text"
							value={secretValue}
							onChange={e => setSecretValue(e.target.value)}
							placeholder="e.g., 123456789"
							className="w-full p-3 bg-dark-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors mb-4"
						/>
						<button
							onClick={handleHashSingle}
							disabled={loading}
							className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
						>
							{loading ? (
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<>⚡ Generate Commitment</>
							)}
						</button>

						{singleResult && (
							<ResultBox label="Your Commitment" value={singleResult} copyKey="single" />
						)}
					</div>
				)}

				{/* ── Password Hash ── */}
				{activeTab === 'password' && (
					<div>
						<div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 mb-5">
							<p className="text-sm text-gray-400 leading-relaxed">
								<span className="text-blue-400 font-medium">ℹ️ How it works:</span> Convert your password to a number and generate a Poseidon hash with a salt. Keep your password and salt private.
							</p>
						</div>

						<label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
						<input
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							placeholder="Enter your password"
							className="w-full p-3 bg-dark-900 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors mb-4"
						/>

						<label className="block text-sm font-medium text-gray-300 mb-2">
							Salt <span className="text-gray-500 font-normal">(leave empty to generate random)</span>
						</label>
						<input
							type="text"
							value={salt}
							onChange={e => setSalt(e.target.value)}
							placeholder="e.g., 987654321"
							className="w-full p-3 bg-dark-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors mb-4"
						/>

						<button
							onClick={handleHashPassword}
							disabled={loading}
							className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
						>
							{loading ? (
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<>🔑 Generate Password Hash</>
							)}
						</button>

						{passwordResult && (
							<div className="space-y-0">
								<ResultBox label="Password as Number" value={passwordResult.num} copyKey="pwd-num" isPrivate />
								<ResultBox label="Salt" value={passwordResult.salt} copyKey="pwd-salt" isPrivate />
								<ResultBox label="Stored Hash (share publicly)" value={passwordResult.hash} copyKey="pwd-hash" />
							</div>
						)}
					</div>
				)}

				{/* ── Merkle Tree ── */}
				{activeTab === 'merkle' && (
					<div>
						<div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 mb-5">
							<p className="text-sm text-gray-400 leading-relaxed">
								<span className="text-blue-400 font-medium">ℹ️ How it works:</span> Enter a list of values (one per line) to build a Merkle tree. You'll get the root and a proof path for a specific leaf. Use this for whitelist membership proofs.
							</p>
						</div>

						<label className="block text-sm font-medium text-gray-300 mb-2">Values (one per line, up to 256)</label>
						<textarea
							value={leaves}
							onChange={e => setLeaves(e.target.value)}
							rows={5}
							placeholder={"Enter values, one per line:\n123\n456\n789"}
							className="w-full p-3 bg-dark-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors mb-4 resize-none"
						/>

						<label className="block text-sm font-medium text-gray-300 mb-2">Your Position (0-indexed)</label>
						<input
							type="number"
							value={leafIndex}
							onChange={e => setLeafIndex(e.target.value)}
							min="0"
							className="w-full p-3 bg-dark-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors mb-4"
						/>

						<button
							onClick={handleBuildMerkle}
							disabled={loading}
							className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
						>
							{loading ? (
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<>🌳 Generate Merkle Proof</>
							)}
						</button>

						{merkleResult && (
							<div className="space-y-0">
								<ResultBox label="Merkle Root (share publicly)" value={merkleResult.root} copyKey="mk-root" />
								<ResultBox label="Your Leaf Value" value={merkleResult.leaf} copyKey="mk-leaf" isPrivate />
								<ResultBox label="Path Elements" value={JSON.stringify(merkleResult.path)} copyKey="mk-path" isPrivate />
								<ResultBox label="Path Indices" value={JSON.stringify(merkleResult.indices)} copyKey="mk-idx" isPrivate />
							</div>
						)}
					</div>
				)}
			</div>

			</>)}
		</div>
	);
};

export default PoseidonHelper;
