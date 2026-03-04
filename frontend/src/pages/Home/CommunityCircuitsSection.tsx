import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface FeaturedCircuit {
	id: number;
	hash: string;
	name: string | null;
	description: string | null;
	code: string | null;
	created_by: string | null;
	is_public: boolean | null;
	deployed_address: string | null;
	input_signals: string[] | null;
	input_descriptions: Record<string, string> | null;
}

interface CommunityCircuitsSectionProps {
	featured: FeaturedCircuit[];
}

const formatAddress = (addr: string) => {
	if (addr.length <= 16) return addr;
	return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
};

const CommunityCircuitsSection: React.FC<CommunityCircuitsSectionProps> = ({ featured }) => {
	const navigate = useNavigate();

	if (featured.length === 0) return null;

	return (
		<section className="py-20 border-b border-gray-800">
			<div className="container-custom">
				<div className="flex items-center justify-between mb-12">
					<div>
						<h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
							Circuits
							<span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-dark-800 border border-gray-700 rounded-full">
								{featured.length}
							</span>
						</h2>
						<p className="text-gray-400">Circuits already deployed by the community and ready to use</p>
					</div>
					<Link to="/circuits" className="text-primary hover:text-primary-light flex items-center space-x-2 transition-colors">
						<span>View All</span>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</Link>
				</div>
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{featured.slice(0, 6).map((circuit) => (
						<div key={circuit.id} className="card-hover flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-3">
									{circuit.deployed_address ? (
										<span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
											Deployed
										</span>
									) : (
										<span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
											Public
										</span>
									)}
									{circuit.created_by && (
										<span className="text-xs text-gray-500 font-mono">
											{formatAddress(circuit.created_by)}
										</span>
									)}
								</div>
								<h3 className="text-lg font-semibold text-white mb-1">
									{circuit.name || `Circuit ${formatAddress(circuit.hash)}`}
								</h3>
								{circuit.description && (
									<p className="text-gray-400 text-sm mb-2 line-clamp-2">{circuit.description}</p>
								)}
								{circuit.input_signals && circuit.input_signals.length > 0 && (
									<div className="flex flex-wrap gap-1 mb-2">
										{circuit.input_signals.map((sig) => (
											<span key={sig} className="text-xs px-2 py-0.5 rounded bg-dark-700 text-gray-400 border border-gray-700">
												{sig}
											</span>
										))}
									</div>
								)}
							</div>
							<div className="mt-4 flex items-center justify-end">
								<button
									onClick={() => navigate(`/prove/${circuit.hash}`, {
										state: {
											circuit_hash: circuit.hash,
											deployed_address: circuit.deployed_address,
											input_signals: circuit.input_signals,
											input_descriptions: circuit.input_descriptions,
											from: '/',
										},
									})}
									disabled={!circuit.deployed_address}
									className="btn btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
									</svg>
									Generate Proof
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default CommunityCircuitsSection;
