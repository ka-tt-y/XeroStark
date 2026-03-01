import React, { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { Link, useLocation } from 'react-router-dom';
import MyCircuits from './MyCircuits';
import MyProofs from './MyProofs';

type TabType = 'circuits' | 'proofs';

const Dashboard: React.FC = () => {
	const { address, isConnected } = useAccount();
	const location = useLocation();
	const initialTab = (location.state as { tab?: TabType } | null)?.tab;
	const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'circuits');

	// Redirect if not connected
	if (!isConnected || !address) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center max-w-md">
					<div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
						<svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">Connect Wallet to View Dashboard</h2>
					<p className="text-gray-400 mb-8">
						Connect your Starknet wallet to view your circuits, proofs, and deployments.
					</p>
					<Link to="/" className="btn btn-primary">
						Go to Home
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Header Section */}
			<section className="relative overflow-hidden border-b border-gray-800">
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-16 -left-10 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
					<div className="absolute -bottom-24 -right-12 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
				</div>
				<div className="container-custom py-12 relative">
					<div className="flex items-center justify-between flex-wrap gap-4">
						<div>
							<h1 className="text-3xl font-bold text-white mb-5">
								My Dashboard
							</h1>
							<p className="text-gray-400">
								Manage your circuits, proofs, and deployments
							</p>
						</div>

					</div>
				</div>
			</section>

			{/* Tabs Section */}
			<section className="py-8 border-b border-gray-800">
				<div className="container-custom">
					<div className="flex gap-4">
						<button
							onClick={() => setActiveTab('circuits')}
							className={`px-6 py-3 rounded-lg font-medium transition-all ${
								activeTab === 'circuits'
									? 'bg-primary text-white'
									: 'bg-dark-800/50 text-gray-400 hover:text-white hover:bg-dark-700'
							}`}
						>
							<div className="flex items-center gap-2">
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
								</svg>
								My Circuits
							</div>
						</button>
						<button
							onClick={() => setActiveTab('proofs')}
							className={`px-6 py-3 rounded-lg font-medium transition-all ${
								activeTab === 'proofs'
									? 'bg-primary text-white'
									: 'bg-dark-800/50 text-gray-400 hover:text-white hover:bg-dark-700'
							}`}
						>
							<div className="flex items-center gap-2">
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
								My Proofs
							</div>
						</button>
					</div>
				</div>
			</section>

			{/* Content Section */}
			<section className="py-10">
				<div className="container-custom">
					{activeTab === 'circuits' && <MyCircuits address={address} />}
					{activeTab === 'proofs' && <MyProofs address={address} />}
				</div>
			</section>
		</div>
	);
};

export default Dashboard;
