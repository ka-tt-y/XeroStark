import React from 'react';

interface ProofDetailsGridProps {
	circuitName: string;
	circuitType: string;
	circuitHash: string;
	formattedDate: string;
	proverAddress?: string;
	verifierAddress?: string;
	onCopy: (text: string, label: string) => void;
}

const ProofDetailsGrid: React.FC<ProofDetailsGridProps> = ({
	circuitName,
	circuitType,
	circuitHash,
	formattedDate,
	proverAddress,
	verifierAddress,
	onCopy,
}) => (
	<div className="grid sm:grid-cols-2 gap-4">
		{/* Circuit info */}
		<div className="card p-0 overflow-hidden">
			<div className="px-5 py-3.5 border-b border-gray-700/60 bg-dark-800/60">
				<h3 className="font-semibold text-white text-sm">Circuit</h3>
			</div>
			<div className="divide-y divide-gray-800/60">
				<div className="px-5 py-3 flex items-center justify-between">
					<span className="text-xs text-gray-500">Name</span>
					<span className="text-sm text-white font-medium">{circuitName}</span>
				</div>
				<div className="px-5 py-3 flex items-center justify-between">
					<span className="text-xs text-gray-500">Type</span>
					<span className={`px-2 py-0.5 rounded text-xs font-medium ${
						circuitType === 'circom'
							? 'bg-green-500/15 text-green-400'
							: 'bg-purple-500/15 text-purple-400'
					}`}>
						{circuitType.toUpperCase()}
					</span>
				</div>
				<div className="px-5 py-3">
					<div className="flex items-center justify-between mb-1.5">
						<span className="text-xs text-gray-500">Hash</span>
						<button
							onClick={() => onCopy(circuitHash, 'Circuit hash')}
							className="text-gray-500 hover:text-gray-300 transition-colors"
							title="Copy hash"
						>
							<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
						</button>
					</div>
					<p className="font-mono text-[11px] text-gray-400 break-all leading-relaxed">{circuitHash}</p>
				</div>
				<div className="px-5 py-3 flex items-center justify-between">
					<span className="text-xs text-gray-500">Created</span>
					<span className="text-xs text-gray-400">{formattedDate}</span>
				</div>
			</div>
		</div>

		{/* Participants */}
		<div className="card p-0 overflow-hidden">
			<div className="px-5 py-3.5 border-b border-gray-700/60 bg-dark-800/60">
				<h3 className="font-semibold text-white text-sm">Participants</h3>
			</div>
			<div className="divide-y divide-gray-800/60">
				{proverAddress && (
					<div className="px-5 py-3">
						<span className="text-xs text-gray-500 block mb-1">Prover</span>
						<button
							onClick={() => onCopy(proverAddress, 'Prover address')}
							className="font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors break-all text-left"
						>
							{proverAddress}
						</button>
					</div>
				)}

				{verifierAddress && (
					<div className="px-5 py-3">
						<span className="text-xs text-gray-500 block mb-1">Verifier contract</span>
						<button
							onClick={() => onCopy(verifierAddress, 'Verifier address')}
							className="font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors break-all text-left"
						>
							{verifierAddress}
						</button>
					</div>
				)}
				{!proverAddress && !verifierAddress && (
					<div className="px-5 py-6 text-center">
						<p className="text-xs text-gray-500">No participant data available</p>
					</div>
				)}
			</div>
		</div>
	</div>
);

export default ProofDetailsGrid;
