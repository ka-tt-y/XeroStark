import React from 'react';

interface VerifiedBannerProps {
	txHash: string;
	verifierAddress?: string;
	onCopy: (text: string, label: string) => void;
}

const VerifiedBanner: React.FC<VerifiedBannerProps> = ({ txHash, verifierAddress, onCopy }) => (
	<div className="rounded-xl border border-green-500/20 bg-linear-to-r from-green-500/5 via-dark-800 to-dark-800 overflow-hidden">
		<div className="p-5">
			<div className="flex items-start gap-4">
				<div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
					<svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-white text-sm mb-1">Cryptographically verified on Starknet</h3>
					<p className="text-xs text-gray-400 mb-4">
						This proof was submitted and verified on-chain. The result is permanent and publicly auditable by anyone.
					</p>

					<div className="grid sm:grid-cols-2 gap-2">
						<div className="p-3 rounded-lg bg-dark-900/60 border border-gray-800/50">
							<span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Transaction</span>
							<button
								onClick={() => onCopy(txHash, 'Transaction hash')}
								className="block font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-1 truncate w-full text-left"
								title={txHash}
							>
								{txHash}
							</button>
						</div>

						{verifierAddress && (
							<div className="p-3 rounded-lg bg-dark-900/60 border border-gray-800/50">
								<span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Verifier Contract</span>
								<button
									onClick={() => onCopy(verifierAddress, 'Verifier address')}
									className="block font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-1 truncate w-full text-left"
									title={verifierAddress}
								>
									{verifierAddress}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800/50">
				<a
					href={`https://sepolia.voyager.online/tx/${txHash}`}
					target="_blank"
					rel="noopener noreferrer"
					className="btn btn-primary inline-flex items-center gap-2 text-sm py-2! px-4!"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
					View on Voyager
				</a>
				<button
					onClick={() => onCopy(window.location.href, 'Proof URL')}
					className="btn btn-secondary inline-flex items-center gap-2 text-sm py-2! px-4!"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
					</svg>
					Share
				</button>
			</div>
		</div>
	</div>
);

export default VerifiedBanner;
