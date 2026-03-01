import React from 'react';
import { useNavigate } from 'react-router-dom';

interface VerifyResponse {
	success: boolean;
	message: string;
	verified?: boolean;
	transaction_hash?: string;
	contract_address?: string;
	proof_id?: number;
	already_verified?: boolean;
}

interface VerifyResultSectionProps {
	verifyResult: VerifyResponse;
	shareUrl: string | null;
	sharing: boolean;
	onShare: () => void;
	onCopyLink: () => void;
}

const formatAddress = (address: string) => {
	if (address.length <= 20) return address;
	return `${address.slice(0, 10)}...${address.slice(-8)}`;
};

const VerifyResultSection: React.FC<VerifyResultSectionProps> = ({
	verifyResult,
	shareUrl,
	sharing,
	onShare,
	onCopyLink,
}) => {
	const navigate = useNavigate();

	return (
		<div className="space-y-5">
			{/* Success banner */}
			<div className="card p-0 overflow-hidden border-cyan-500/30">
				<div className="px-5 py-4 border-b border-cyan-500/20 bg-cyan-500/10">
					<div className="flex items-center gap-2">
						<svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
						<span className="text-cyan-400 font-semibold text-sm">Proof Published On-Chain</span>
					</div>
				</div>
				<div className="p-5">
					<p className="text-sm text-gray-300 leading-relaxed mb-4">
						Your proof has been published to Starknet. The blockchain has confirmed it is <strong className="text-white">mathematically valid</strong> — this record is permanent and publicly auditable.
					</p>
					{verifyResult.transaction_hash && /^0x[a-fA-F0-9]{50,64}$/.test(verifyResult.transaction_hash) && (
						<a
							href={`https://sepolia.voyager.online/tx/${verifyResult.transaction_hash}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 transition-colors text-cyan-300 text-sm font-medium border border-cyan-500/20"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
							View on Voyager
							<span className="text-xs text-cyan-400/60 font-mono">({formatAddress(verifyResult.transaction_hash)})</span>
						</a>
					)}
				</div>
			</div>

			{/* Share link */}
			{shareUrl ? (
				<div className="card p-5">
					<p className="text-xs text-gray-500 mb-2">Shareable verification link</p>
					<div className="flex items-center gap-2">
						<a
							href={shareUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-cyan-400 hover:text-cyan-300 break-all flex-1"
						>
							{shareUrl}
						</a>
						<button
							onClick={onCopyLink}
							className="btn btn-secondary shrink-0 p-2!"
							title="Copy link"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
							</svg>
						</button>
					</div>
				</div>
			) : verifyResult.proof_id ? (
				<button
					onClick={onShare}
					disabled={sharing}
					className="btn btn-secondary inline-flex items-center gap-2 text-sm"
				>
					{sharing ? (
						<>
							<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							Generating link...
						</>
					) : (
						<>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
							</svg>
							Share Verification
						</>
					)}
				</button>
			) : null}

			{/* Navigation */}
			<div className="flex gap-3">
				<button
					onClick={() => navigate('/dashboard', { state: { tab: 'proofs' } })}
					className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2 text-sm"
				>
					Go to My Proofs
				</button>
				<button onClick={() => navigate(-1)} className="btn btn-secondary text-sm">
					← Back
				</button>
			</div>
		</div>
	);
};

export default VerifyResultSection;
