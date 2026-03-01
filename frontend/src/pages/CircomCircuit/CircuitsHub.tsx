import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CircuitsHub: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'circom' | 'noir'>('circom');

	return (
		<div className="min-h-screen">
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-16 -left-10 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
					<div className="absolute -bottom-24 -right-12 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
				</div>
			<div className="container-custom py-12 md:py-12 relative">

					<h1 className="text-3xl font-bold text-white mb-4">
						Templates
					</h1>
					<p className="text-md text-gray-400 max-w-xl">
						Explore templates or upload custom circuits.
					</p>
				</div>
			</section>

			<section className="py-12 ">
				<div className="container-custom">
					<div className="flex flex-col sm:flex-row gap-3 mb-8">
						<button
							onClick={() => setActiveTab('circom')}
							className={`px-6 py-3 rounded-lg font-medium transition-all ${
								activeTab === 'circom'
									? 'bg-primary text-white'
									: 'bg-dark-800 text-gray-300 hover:bg-dark-700 light:bg-gray-100 light:text-gray-600 light:hover:bg-gray-200'
							}`}
						>
							<span className="flex items-center gap-2">
								<span>Circom</span>
								
								<span className="text-xs px-2 py-1 bg-dark-700/50 light:bg-gray-200/50 rounded">Verified</span>
							</span>
						</button>
						<button
							onClick={() => setActiveTab('noir')}
							className={`px-6 py-3 rounded-lg font-medium transition-all ${
								activeTab === 'noir'
									? 'bg-primary text-white'
									: 'bg-dark-800 text-gray-300 hover:bg-dark-700 light:bg-gray-100 light:text-gray-600 light:hover:bg-gray-200'
							}`}
						>
							<span className="flex items-center gap-2">
								<span>Noir</span>
								<span className="text-xs px-2 py-1 bg-dark-700/50 rounded">Coming Soon</span>
							</span>
						</button>
					</div>

					{activeTab === 'circom' && (
						<>
						<div className="grid md:grid-cols-2 gap-6">
							<Link
								to="/templates/browse"
								className="card-hover group"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
										<svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
										</svg>
									</div>
									<span className="text-xs text-gray-500">From Circomlib</span>
								</div>
								<h3 className="text-xl font-semibold text-white mb-2">Browse Templates</h3>
								<p className="text-gray-400 text-sm mb-4">
									Explore verified Circom circuits from the official Circomlib repository.
								</p>
								<div className="text-primary text-sm font-medium">Explore →</div>
							</Link>

							<Link
								to="/templates/upload"
								className="card-hover group"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="w-12 h-12 rounded-lg bg-accent-pink/20 flex items-center justify-center group-hover:bg-accent-pink/30 transition-colors">
										<svg className="w-6 h-6 text-accent-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
									</div>
									<span className="text-xs text-gray-500">Custom</span>
								</div>
								<h3 className="text-xl font-semibold text-white mb-2">Upload Circuit</h3>
								<p className="text-gray-400 text-sm mb-4">
									Upload your custom Circom circuit file to add it to your workspace.
								</p>
								<div className="text-primary text-sm font-medium">Upload →</div>
							</Link>
						</div>

						</>
					)}

					{activeTab === 'noir' && (
						<div className="card text-center py-12">
							<div className="w-16 h-16 rounded-lg bg-dark-700 flex items-center justify-center mx-auto mb-4 opacity-50">
								<svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-300 mb-2">Noir Support Coming Soon</h3>
							{/* <p className="text-gray-400">
								Noir circuit templates and upload functionality will be available in the next release.
							</p> */}
						</div>
					)}
				</div>
			</section>

</div>

	);
};

export default CircuitsHub;
