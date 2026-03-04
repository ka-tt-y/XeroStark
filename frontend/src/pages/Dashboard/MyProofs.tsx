import React, { useEffect, useState } from 'react';
import { getUserProofs, shareProof } from '../../api';
import Toast, { ToastType } from '../../components/Toast';
import ProofCard from './ProofCard';

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

interface ToastState {
	show: boolean;
	message: string;
	type: ToastType;
}

interface MyProofsProps {
	address: string;
}

const MyProofs: React.FC<MyProofsProps> = ({ address }) => {
	const [proofs, setProofs] = useState<Proof[]>([]);
	const [loading, setLoading] = useState(true);
	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
	const [expandedProofId, setExpandedProofId] = useState<number | null>(null);
	const [sharingId, setSharingId] = useState<number | null>(null);
	const [shareUrls, setShareUrls] = useState<Record<number, string>>({});

	useEffect(() => {
		fetchProofs();
	}, [address]);

	const fetchProofs = async () => {
		try {
			setLoading(true);
			const data = await getUserProofs(address);
			setProofs(data);
		} catch (error: unknown) {
			console.error('Failed to fetch proofs:', error);
			showToast(error instanceof Error ? error.message : 'Failed to load your proofs', 'error');
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

	const handleShareProof = async (proofId: number) => {
		if (shareUrls[proofId]) {
			navigator.clipboard.writeText(shareUrls[proofId]);
			showToast('Link copied to clipboard!', 'success');
			return;
		}
		try {
			setSharingId(proofId);
			const { share_token } = await shareProof(proofId);
			const url = `${window.location.origin}/proof/${share_token}`;
			setShareUrls(prev => ({ ...prev, [proofId]: url }));
			navigator.clipboard.writeText(url);
			showToast('Link generated & copied!', 'success');
		} catch (error: unknown) {
			showToast(error instanceof Error ? error.message : 'Failed to share proof', 'error');
		} finally {
			setSharingId(null);
		}
	};

	const handleCopyShareUrl = (url: string) => {
		navigator.clipboard.writeText(url);
		showToast('Copied!', 'success');
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-400">Loading your proofs...</p>
				</div>
			</div>
		);
	}

	if (proofs.length === 0) {
		return (
			<div className="text-center py-20">
				<div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
					<svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<h3 className="text-xl font-semibold text-white mb-2">No Proofs Generated Yet</h3>
				<p className="text-gray-400 mb-8 max-w-md mx-auto">
					You haven't generated any proofs yet. Upload a circuit and generate your first zero-knowledge proof.
				</p>
				<a href="/templates/upload" className="btn btn-primary">
					Get Started
				</a>
			</div>
		);
	}

	return (
		<>
			<div className="grid md:grid-cols-2 gap-4">
				{proofs.map((proof) => (
					<ProofCard
						key={proof.id}
						proof={proof}
						isExpanded={expandedProofId === proof.id}
						shareUrl={shareUrls[proof.id]}
						sharingId={sharingId}
						onToggleExpand={() => setExpandedProofId(expandedProofId === proof.id ? null : proof.id)}
						onShareProof={handleShareProof}
						onCopyShareUrl={handleCopyShareUrl}
					/>
				))}
			</div>

			{toast.show && (
				<Toast message={toast.message} type={toast.type} onClose={hideToast} />
			)}
		</>
	);
};

export default MyProofs;
