import React from 'react';

interface Proof {
	id: number;
	circuit_id: number;
	circuit_name?: string;
	circuit_hash: string;
	proof_data: any;
	public_inputs: any;
	calldata?: string;
	tx_hash?: string;
	tx_status?: string;
	verification_status: 'pending' | 'verified' | 'failed';
	shared_token?: string;
	created_at: string;
}

interface ProofCardProps {
	proof: Proof;
	isExpanded: boolean;
	shareUrl?: string;
	sharingId: number | null;
	onToggleExpand: () => void;
	onShareProof: (proofId: number) => void;
	onCopyShareUrl: (url: string) => void;
}

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const formatAddress = (addr: string) => {
	if (addr.length <= 20) return addr;
	return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
};

const openTxInVoyager = (txHash: string) => {
	window.open(`https://sepolia.voyager.online/tx/${txHash}`, '_blank');
};

const getStatusBadge = (status: string) => {
	switch (status) {
		case 'verified':
			return (
				<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
					<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
					Verified
				</span>
			);
		case 'pending':
			return (
				<span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
					<svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Pending
				</span>
			);
		case 'failed':
			return (
				<span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 flex items-center gap-1">
					<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
					Failed
				</span>
			);
		default:
			return null;
	}
};

const ProofCard: React.FC<ProofCardProps> = ({
	proof,
	isExpanded,
	shareUrl,
	sharingId,
	onToggleExpand,
	onShareProof,
	onCopyShareUrl,
}) => (
	<div className="card p-6 hover:border-primary/50 transition-colors flex flex-col justify-between">
		<div>
			<div className="flex items-center gap-3 mb-2 flex-wrap">
				<h3 className="text-base font-semibold text-white">
					{proof.circuit_name || 'Circuit Proof'}
				</h3>
				{getStatusBadge(proof.verification_status)}
			</div>
			
			<div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
				<span className="flex items-center gap-1 shrink-0">
					<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
					</svg>
					{formatAddress(proof.circuit_hash)}
				</span>
				<span className="flex items-center gap-1">
					<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					{formatDate(proof.created_at)}
				</span>
			</div>

			{proof.public_inputs && (
				<p className="text-xs text-gray-400 mb-3">
					<span className="text-gray-500">Public inputs:</span>{' '}
					<span className="font-mono">
						{JSON.stringify(proof.public_inputs)}
					</span>
				</p>
			)}
		</div>

		<div className="flex items-center gap-2 flex-wrap">
			<button
				onClick={onToggleExpand}
				className="btn btn-secondary btn-sm"
				title="View details"
			>
				<svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{proof.tx_hash && (
				<button
					onClick={() => openTxInVoyager(proof.tx_hash!)}
					className="btn btn-primary btn-sm"
					title="View on Voyager"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
				</button>
			)}
			{proof.verification_status === 'verified' && proof.tx_hash && (
				<button
					onClick={() => onShareProof(proof.id)}
					className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
					title={shareUrl ? 'Copy share link' : 'Generate & copy share link'}
					disabled={sharingId === proof.id}
				>
					{sharingId === proof.id ? (
						<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
					) : shareUrl ? (
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
						</svg>
					) : (
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
						</svg>
					)}
				</button>
			)}
		</div>

		{/* Expanded Details */}
		{isExpanded && (
			<div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
				{proof.public_inputs && (
					<div>
						<p className="text-xs text-gray-500 mb-2">Public Inputs</p>
						<pre className="p-3 bg-dark-800 rounded-lg text-xs text-gray-300 font-mono overflow-x-auto">
							{JSON.stringify(proof.public_inputs, null, 2)}
						</pre>
					</div>
				)}
				
				{proof.tx_hash && (
					<div className="flex items-center gap-2 p-3 rounded-lg bg-dark-800">
						<span className="text-xs text-gray-500">Transaction:</span>
						<button
							onClick={() => openTxInVoyager(proof.tx_hash!)}
							className="font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
						>
							{formatAddress(proof.tx_hash)}
						</button>
					</div>
				)}
				{proof.verification_status === 'verified' && proof.tx_hash && (
					<div className="p-3 rounded-lg bg-dark-800 border border-gray-700">
						<p className="text-xs text-gray-500 mb-2">Shareable link</p>
						{shareUrl ? (
							<div className="flex items-center gap-2">
								<a
									href={shareUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-cyan-400 hover:text-cyan-300 break-all flex-1"
								>
									{shareUrl}
								</a>
								<button
									onClick={() => onCopyShareUrl(shareUrl)}
									className="btn btn-secondary btn-sm shrink-0"
									title="Copy link"
								>
									<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
									</svg>
								</button>
							</div>
						) : (
							<button
								onClick={() => onShareProof(proof.id)}
								className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
								disabled={sharingId === proof.id}
							>
								{sharingId === proof.id ? (
									<>
										<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
										Generating...
									</>
								) : (
									<>
										<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
										</svg>
										Generate Link
									</>
								)}
							</button>
						)}
					</div>
				)}
			</div>
		)}
	</div>
);

export default ProofCard;
