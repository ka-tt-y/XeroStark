import React, { useEffect, useRef, useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { useLocation, useParams, Link } from 'react-router-dom';
import { getVerifyCalldata, registerProof, shareProof } from '../../api';
import Breadcrumb from '../../components/Breadcrumb';
import Toast, { ToastType } from '../../components/Toast';
import { PAYMASTER_DETAILS } from '../../paymaster';
import VerifyResultSection from './VerifyResultSection';
import PublishActionCard from './PublishActionCard';
import VerifySidebar from './VerifySidebar';

// Publish stages — driven by actual progress, not estimated durations
const PUBLISH_STAGES = [
	{ name: 'Preparing proof data', icon: '📋' },
	{ name: 'Generating calldata', icon: '🔧' },
	{ name: 'Approve in wallet (Gasfree!)', icon: '👛' },
	{ name: 'Submitting to Starknet', icon: '📤' },
	{ name: 'Registering proof', icon: '✅' },
];

interface VerifyResponse {
	success: boolean;
	message: string;
	verified?: boolean;
	transaction_hash?: string;
	contract_address?: string;
	proof_id?: number;
	already_verified?: boolean;
}

interface LocationState {
	circuit_hash: string;
	deployed_address: string;
	proof?: string;
	public_signals?: string;
}

interface ToastState {
	show: boolean;
	message: string;
	type: ToastType;
}

const ProofVerify: React.FC = () => {
	const location = useLocation();
	const { circuitHash } = useParams<{ circuitHash: string }>();
	const state = location.state as LocationState | null;
	const resolvedHash = circuitHash || state?.circuit_hash || '';
	const { address, account } = useAccount();
	const [verifying, setVerifying] = useState(false);
	const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
	const [shareUrl, setShareUrl] = useState<string | null>(null);
	const [sharing, setSharing] = useState(false);
	const hasStarted = useRef(false);

	// Progress tracking
	const [currentStage, setCurrentStage] = useState(0);
	const [elapsedTime, setElapsedTime] = useState(0);

	// Elapsed timer — just a clock, stages are driven by actual events
	useEffect(() => {
		if (!verifying) {
			setElapsedTime(0);
			return;
		}

		const startTime = Date.now();
		const interval = setInterval(() => {
			setElapsedTime((Date.now() - startTime) / 1000);
		}, 1000);

		return () => clearInterval(interval);
	}, [verifying]);

	useEffect(() => {
		if (!hasStarted.current && state?.proof && state?.public_signals && account) {
			hasStarted.current = true;
			handleVerifyOnChain();
		}
	}, [account]);

	if (!resolvedHash || !state?.deployed_address || !state?.proof || !state?.public_signals) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-white mb-4">No proof data found</h2>
					<p className="text-gray-400 mb-6">Please generate a proof first.</p>
					<Link to="/templates" className="btn btn-primary">
						Back to Templates
					</Link>
				</div>
			</div>
		);
	}

	const showToast = (message: string, type: ToastType) => {
		setToast({ show: true, message, type });
	};

	const hideToast = () => {
		setToast({ ...toast, show: false });
	};

	const handleVerifyOnChain = async () => {
		if (!account) {
			showToast('Please connect your wallet first. Your wallet is needed to submit the verification transaction.', 'error');
			return;
		}

		try {
			setVerifying(true);

			// Stage 0: Preparing proof data
			setCurrentStage(0);

			// Stage 1: Generating calldata
			setCurrentStage(1);
			const calldataResponse = await getVerifyCalldata({
				circuit_hash: resolvedHash,
				proof: state.proof!,
				public_signals: state.public_signals!,
				created_by: address || undefined,
			}) as any;

			// If already verified, handle that case (backend returns cached result)
			if (calldataResponse.already_verified) {
				setVerifyResult({
					success: true,
					message: 'Proof already verified on-chain',
					verified: true,
					transaction_hash: calldataResponse.transaction_hash,
					contract_address: calldataResponse.contract_address,
					proof_id: calldataResponse.proof_id,
					already_verified: true,
				});
				showToast('This proof was already verified on-chain.', 'info');
				// Auto-generate share link
				if (calldataResponse.proof_id) {
					try {
						const { share_url } = await shareProof(calldataResponse.proof_id);
						setShareUrl(share_url);
					} catch { /* non-critical */ }
				}
				return;
			}

			if (!calldataResponse.success || !calldataResponse.calldata) {
				showToast(calldataResponse.message || 'Failed to generate calldata', 'error');
				return;
			}

			const calldata: string[] = calldataResponse.calldata;
			const contractAddress: string = calldataResponse.contract_address;

			// Stage 2: Waiting for wallet approval
			setCurrentStage(2);
			showToast('Please approve the verification transaction in your wallet...', 'info');

			const txResult = await account.executePaymasterTransaction([
				{
					contractAddress: contractAddress,
					entrypoint: 'verify_groth16_proof_bn254',
					calldata: calldata,
				},
			], PAYMASTER_DETAILS);

			// Stage 3: Submitted, waiting for confirmation
			setCurrentStage(3);

			const txHash = typeof txResult.transaction_hash === 'string'
				? txResult.transaction_hash
				: String(txResult.transaction_hash);

			// Stage 4: Registering proof in backend
			setCurrentStage(4);
			const registerResponse = await registerProof({
				circuit_hash: resolvedHash,
				proof: state.proof!,
				public_signals: state.public_signals!,
				tx_hash: txHash,
				created_by: address || undefined,
			}) as any;

			setVerifyResult({
				success: true,
				message: 'Proof verified on-chain successfully',
				verified: true,
				transaction_hash: txHash,
				contract_address: contractAddress,
				proof_id: registerResponse.proof_id,
			});
			showToast('Proof verified on-chain successfully!', 'success');

			// Auto-generate share link
			if (registerResponse.proof_id) {
				try {
					const { share_url } = await shareProof(registerResponse.proof_id);
					setShareUrl(share_url);
				} catch { /* non-critical */ }
			}
		} catch (error: unknown) {
			console.error('Verify failed:', error);
			const msg = error instanceof Error ? error.message : 'Failed to verify on-chain. Please try again.';
			showToast(msg, 'error');
		} finally {
			setVerifying(false);
		}
	};

	const handleShare = async () => {
		if (!verifyResult?.proof_id) return;
		try {
			setSharing(true);
			const { share_url } = await shareProof(verifyResult.proof_id);
			setShareUrl(share_url);
			showToast('Share link generated!', 'success');
		} catch (error: unknown) {
			showToast(error instanceof Error ? error.message : 'Failed to generate share link', 'error');
		} finally {
			setSharing(false);
		}
	};

	const handleCopyLink = () => {
		if (shareUrl) {
			navigator.clipboard.writeText(shareUrl);
			showToast('Copied!', 'success');
		}
	};

	return (
		<div className="min-h-screen">
			<section className="py-8">
				<div className="container-custom max-w-5xl">
					<Breadcrumb to="/templates" />

					<div className="grid lg:grid-cols-5 gap-6 mt-2">
						{/* Left column — main action area (3/5) */}
						<div className="lg:col-span-3 space-y-5">
							<div>
								<h1 className="text-2xl font-bold text-white mb-1">Publish Proof</h1>
								<p className="text-gray-400 text-sm">Submit your proof to Starknet for on-chain verification</p>
							</div>

							{verifyResult ? (
								<VerifyResultSection
									verifyResult={verifyResult}
									shareUrl={shareUrl}
									sharing={sharing}
									onShare={handleShare}
									onCopyLink={handleCopyLink}
								/>
							) : (
								<PublishActionCard
									verifying={verifying}
									stages={PUBLISH_STAGES}
									currentStage={currentStage}
									elapsedTime={elapsedTime}
									onVerify={handleVerifyOnChain}
								/>
							)}
						</div>

						{/* Right column — context sidebar (2/5) */}
						<VerifySidebar deployedAddress={state.deployed_address} />
					</div>
				</div>
			</section>

			{toast.show && (
				<Toast message={toast.message} type={toast.type} onClose={hideToast} />
			)}
		</div>
	);
};

export default ProofVerify;
