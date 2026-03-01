import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSharedProof } from '../../api';
import Toast, { ToastType } from '../../components/Toast';
import ProofHeroBanner from './ProofHeroBanner';
import VerifiedBanner from './VerifiedBanner';
import PublicSignalsCard from './PublicSignalsCard';
import ProofDetailsGrid from './ProofDetailsGrid';
import ZkEducationFooter from './ZkEducationFooter';

interface ProofDetails {
	id: number;
	circuit_name: string;
	circuit_hash: string;
	circuit_type: string;
	circuit_description?: string;
	proof_data: any;
	public_inputs: any;
	calldata?: string;
	tx_hash?: string;
	verification_status: 'pending' | 'verified' | 'failed';
	created_at: string;
	verifier_address?: string;
	deployed_by_address?: string;
	prover_address?: string;
	output_signals?: string[];
	public_input_signals?: string[];
	output_descriptions?: Record<string, string>;
	public_input_descriptions?: Record<string, string>;
}

interface ToastState {
	show: boolean;
	message: string;
	type: ToastType;
}

const ProofViewer: React.FC = () => {
	const { token } = useParams<{ token: string }>();
	const [proof, setProof] = useState<ProofDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

	useEffect(() => {
		if (token) {
			fetchProof();
		}
	}, [token]);

	const fetchProof = async () => {
		if (!token) return;
		
		try {
			setLoading(true);
			const data = await getSharedProof(token);
			setProof(data);
		} catch (error: unknown) {
			console.error('Failed to fetch proof:', error);
			setError(error instanceof Error ? error.message : 'Failed to load proof. The link may be invalid or expired.');
		} finally {
			setLoading(false);
		}
	};

	const showToast = (message: string, type: ToastType) => {
		setToast({ show: true, message, type });
	};

	const hideToast = () => {
		setToast({ ...toast, show: false });
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		showToast(`${label} copied to clipboard`, 'success');
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-400">Loading proof...</p>
				</div>
			</div>
		);
	}

	if (error || !proof) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center max-w-md">
					<div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
						<svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">Proof Not Found</h2>
					<p className="text-gray-400 mb-8">
						{error || 'This proof does not exist or the link has expired.'}
					</p>
					<Link to="/" className="btn btn-primary">
						Go to Home
					</Link>
				</div>
			</div>
		);
	}

	const isVerified = proof.verification_status === 'verified';

	return (
		<div className="min-h-screen">
			<ProofHeroBanner
				circuitName={proof.circuit_name}
				circuitType={proof.circuit_type}
				formattedDate={formatDate(proof.created_at)}
				verificationStatus={proof.verification_status}
			/>

			<section className="py-8">
				<div className="container-custom max-w-3xl space-y-6">
					{isVerified && proof.tx_hash && (
						<VerifiedBanner
							txHash={proof.tx_hash}
							verifierAddress={proof.verifier_address}
							onCopy={copyToClipboard}
						/>
					)}

					{/* Description card */}
					<div className="card p-5">
						<div className="flex items-start gap-3">
							<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
								<svg className="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<div>
								<h3 className="font-semibold text-white text-sm mb-1">About this proof</h3>
								{proof.circuit_description ? (
									<p className="text-sm text-gray-400 leading-relaxed">{proof.circuit_description}</p>
								) : (
									<p className="text-sm text-gray-400 leading-relaxed">
										A zero-knowledge proof generated with <span className="text-gray-300 font-medium">{proof.circuit_name}</span>.
										It cryptographically demonstrates that the prover knows valid inputs — <span className="text-gray-300">without revealing what they are</span>.
									</p>
								)}
							</div>
						</div>
					</div>

					{proof.public_inputs && (
						<PublicSignalsCard
							publicInputs={proof.public_inputs}
							outputSignals={proof.output_signals}
							publicInputSignals={proof.public_input_signals}
							outputDescriptions={proof.output_descriptions}
							publicInputDescriptions={proof.public_input_descriptions}
							onCopy={copyToClipboard}
						/>
					)}

					<ProofDetailsGrid
						circuitName={proof.circuit_name}
						circuitType={proof.circuit_type}
						circuitHash={proof.circuit_hash}
						formattedDate={formatDate(proof.created_at)}
						proverAddress={proof.prover_address}
						verifierAddress={proof.verifier_address}
						onCopy={copyToClipboard}
					/>

					<ZkEducationFooter />
				</div>
			</section>

			{toast.show && (
				<Toast message={toast.message} type={toast.type} onClose={hideToast} />
			)}
		</div>
	);
};

export default ProofViewer;
