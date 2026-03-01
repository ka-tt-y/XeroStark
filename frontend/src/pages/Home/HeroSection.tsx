import React from 'react';
import { Link } from 'react-router-dom';

interface PlatformStats {
	total_proofs: number;
	active_circuits: number;
	verified_proofs: number;
	deployments: number;
}

interface HeroSectionProps {
	stats: PlatformStats | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({ stats }) => (
	<section className="relative overflow-hidden">
		<div className="absolute inset-0 pointer-events-none overflow-hidden">
			<div className="absolute -top-20 -left-5 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
			<div className="absolute -bottom-20 -right-10 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
		</div>
		<div className="container-custom py-28 relative">
			<h1 className="text-6xl font-bold mb-6 max-w-2xl">
				Verify{' '}
				<span className="gradient-text">Zero-Knowledge Proofs</span>{' '}
				<span className="text-white">on Starknet</span>
			</h1>

			<p className="text-xl text-gray-400 max-w-xl mb-12">
				Compile Circom circuits, deploy verifier contracts, and prove
				statements on-chain — all from your browser with your Starknet wallet.
			</p>

			<div className="flex flex-wrap gap-4 mb-16">
				<Link to="/templates" className="btn btn-primary">Explore Circuits</Link>
				<Link to="/templates/upload" className="btn btn-secondary">Upload Your Circuit</Link>
			</div>

			{/* Stats */}
			<div className="flex flex-wrap gap-8 md:gap-12">
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
						<svg className="w-6 h-6 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<div className="text-xl font-bold text-white">{stats ? stats.total_proofs.toLocaleString() : '—'}</div>
						<div className="text-sm text-gray-400">Proofs Generated</div>
					</div>
				</div>

				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 rounded-lg bg-accent-pink/20 flex items-center justify-center">
						<svg className="w-6 h-6 text-accent-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
					</div>
					<div>
						<div className="text-xl font-bold text-white">{stats ? stats.active_circuits.toLocaleString() : '—'}</div>
						<div className="text-sm text-gray-400">Active Circuits</div>
					</div>
				</div>

				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
						<svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<div>
						<div className="text-xl font-bold text-white">{stats ? stats.verified_proofs.toLocaleString() : '—'}</div>
						<div className="text-sm text-gray-400">Verified On-Chain</div>
					</div>
				</div>
			</div>
		</div>
	</section>
);

export default HeroSection;
