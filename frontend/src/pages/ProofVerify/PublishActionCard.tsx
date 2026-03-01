import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublishProgressOverlay from './PublishProgressOverlay';

interface PublishStage {
	name: string;
	icon: string;
}

interface PublishActionCardProps {
	verifying: boolean;
	stages: PublishStage[];
	currentStage: number;
	elapsedTime: number;
	onVerify: () => void;
}

const PublishActionCard: React.FC<PublishActionCardProps> = ({
	verifying,
	stages,
	currentStage,
	elapsedTime,
	onVerify,
}) => {
	const navigate = useNavigate();

	return (
		<div className="space-y-5">
			<div className="card p-0 overflow-hidden relative">
				<div className="px-5 py-4 border-b border-gray-700 bg-dark-800/50">
					<h3 className="font-semibold text-white text-sm">On-Chain Verification</h3>
					<p className="text-xs text-gray-500 mt-0.5">Submit a transaction to verify this proof on Starknet</p>
				</div>
				<div className="p-5">
					<p className="text-sm text-gray-400 leading-relaxed mb-5">
						This will send a transaction to the verifier contract. Your wallet will prompt you to approve the transaction. Once confirmed, the proof will be permanently verified on Starknet Sepolia.
					</p>
					<div className="flex gap-3">
						<button
							onClick={onVerify}
							disabled={verifying}
							className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2 text-sm"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
							Publish Proof
						</button>
						<button onClick={() => navigate(-1)} className="btn btn-secondary text-sm">
							← Back
						</button>
					</div>
				</div>

				{verifying && (
					<PublishProgressOverlay
						stages={stages}
						currentStage={currentStage}
						elapsedTime={elapsedTime}
					/>
				)}
			</div>
		</div>
	);
};

export default PublishActionCard;
