import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserCircuits } from '../../api';
import Toast, { ToastType } from '../../components/Toast';

interface Circuit {
	id: number;
	hash: string;
	name: string;
	description: string;
	circuit_type: string;
	created_by: string;
	is_public: boolean;
	created_at: string;
	deployed_address?: string;
	deployment_type?: string;
	input_signals?: string[];
	input_descriptions?: Record<string, string>;
}

interface ToastState {
	show: boolean;
	message: string;
	type: ToastType;
}

interface MyCircuitsProps {
	address: string;
}

const MyCircuits: React.FC<MyCircuitsProps> = ({ address }) => {
	const [circuits, setCircuits] = useState<Circuit[]>([]);
	const [loading, setLoading] = useState(true);
	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

	useEffect(() => {
		fetchCircuits();
	}, [address]);

	const fetchCircuits = async () => {
		try {
			setLoading(true);
			const data = await getUserCircuits(address);
			setCircuits(data);
		} catch (error: unknown) {
			console.error('Failed to fetch circuits:', error);
			showToast(error instanceof Error ? error.message : 'Failed to load your circuits', 'error');
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
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatAddress = (addr: string) => {
		if (addr.length <= 20) return addr;
		return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-400">Loading your circuits...</p>
				</div>
			</div>
		);
	}

	if (circuits.length === 0) {
		return (
			<div className="text-center py-20">
				<div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
					<svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
					</svg>
				</div>
				<h3 className="text-xl font-semibold text-white mb-2">No Circuits Yet</h3>
				<p className="text-gray-400 mb-8 max-w-md mx-auto">
					You haven't created or deployed any circuits yet. Start by uploading a new circuit or browse the public library.
				</p>
				<div className="flex gap-4 justify-center">
					<Link to="/templates/upload" className="btn btn-primary">
						Upload Circuit
					</Link>
					<Link to="/templates" className="btn btn-secondary">
						Browse Library
					</Link>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold text-white">My Circuits</h2>
				<Link to="/templates/upload" className="btn btn-primary btn-sm">
					Upload Circuit
				</Link>
			</div>
			<div className="grid md:grid-cols-2 gap-4">
				{circuits.map((circuit) => (
					<div key={circuit.id} className="card p-6 hover:border-primary/50 transition-colors flex flex-col justify-between">
						<div>
							<div className="flex items-center gap-3 mb-2 flex-wrap">
								<h3 className="text-lg font-semibold text-white truncate">
									{circuit.name || 'Unnamed Circuit'}
								</h3>
								<span className={`px-2 py-1 rounded-full text-xs font-medium ${
									circuit.circuit_type === 'circom'
										? 'bg-green-500/20 text-green-400'
										: 'bg-purple-500/20 text-purple-400'
								}`}>
									{circuit.circuit_type.toUpperCase()}
								</span>
								{circuit.is_public && (
									<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
										Public
									</span>
								)}
							</div>
							
							{circuit.description && (
								<p className="text-sm text-gray-400 mb-3 line-clamp-2">
									{circuit.description}
								</p>
							)}

							<div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
								<span className="flex items-center gap-1">
									<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
									</svg>
									{formatAddress(circuit.hash)}
								</span>
								<span className="flex items-center gap-1">
									<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									{formatDate(circuit.created_at)}
								</span>
								{circuit.deployed_address && (
									<span className="flex items-center gap-1 text-green-400 shrink-0">
										<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
										Deployed
									</span>
								)}
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Link
								to={`/prove/${circuit.hash}`}
								state={{
									circuit_hash: circuit.hash,
									deployed_address: circuit.deployed_address,
									input_signals: circuit.input_signals,
									input_descriptions: circuit.input_descriptions,
									from: '/dashboard',
								}}
								className="btn btn-primary btn-sm"
							>
								Prove
							</Link>
							<button
								onClick={() => {
									navigator.clipboard.writeText(circuit.hash);
									showToast('Circuit hash copied to clipboard', 'success');
								}}
								className="btn btn-secondary btn-sm"
								title="Copy circuit hash"
							>
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							</button>
						</div>
					</div>
				))}
			</div>

			{toast.show && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={hideToast}
				/>
			)}
		</>
	);
};

export default MyCircuits;
