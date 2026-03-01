import React from 'react';

interface ExistingDeploymentInfo {
	circuit_hash: string;
	deployed_address: string;
	input_signals?: string[];
	input_descriptions?: Record<string, string>;
}

interface ExistingDeploymentModalProps {
	deployment: ExistingDeploymentInfo;
	onUseExisting: () => void;
	onDismiss: () => void;
}

const ExistingDeploymentModal: React.FC<ExistingDeploymentModalProps> = ({ deployment, onUseExisting, onDismiss }) => (
	<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
		<div className="bg-dark-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
			<div className="p-5 border-b border-gray-700">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
						<svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-white">Circuit Already Deployed</h3>
				</div>
			</div>
			<div className="p-5">
				<p className="text-gray-400 text-sm mb-4">
					This circuit has already been compiled and deployed on Starknet. You can use the existing verifier contract to generate proofs right away.
				</p>
				<div className="p-3 rounded-lg bg-dark-700/50 border border-gray-700 mb-4">
					<div className="space-y-1.5 text-xs">
						<p className="text-gray-400">
							<span className="text-gray-500">Contract: </span>
							<span className="font-mono text-gray-300">
								{deployment.deployed_address.slice(0, 12)}...{deployment.deployed_address.slice(-8)}
							</span>
						</p>
						<p className="text-gray-400">
							<span className="text-gray-500">Hash: </span>
							<span className="font-mono text-gray-300">
								{deployment.circuit_hash.slice(0, 16)}...
							</span>
						</p>
						{deployment.input_signals && deployment.input_signals.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-1">
								{deployment.input_signals.map((sig) => (
									<span key={sig} className="text-xs px-1.5 py-0.5 rounded bg-dark-700 text-gray-400 border border-gray-600">
										{sig}
									</span>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<button
						onClick={onUseExisting}
						className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
						</svg>
						Use Existing Deployment
					</button>

					<button
						onClick={onDismiss}
						className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors py-1"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
);

export default ExistingDeploymentModal;
