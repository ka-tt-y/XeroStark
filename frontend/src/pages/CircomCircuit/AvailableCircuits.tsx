import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPublicCircuits } from '../../api';

interface PublicCircuit {
	id: number;
	hash: string;
	name: string | null;
	description: string | null;
	code: string | null;
	created_by: string | null;
	is_public: boolean | null;
	created_at: string | null;
	deployed_address: string | null;
	input_signals: string[] | null;
	input_descriptions: Record<string, string> | null;
}

const AvailableCircuits: React.FC = () => {
	const navigate = useNavigate();
	const [circuits, setCircuits] = useState<PublicCircuit[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState('');

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await getPublicCircuits();
				setCircuits(Array.isArray(data) ? data : []);
			} catch (err: unknown) {
				setError(err instanceof Error ? err.message : 'Failed to load available circuits.');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const filteredCircuits = useMemo(() => circuits.filter((c) => {
		if (!query.trim()) return true;
		const term = query.trim().toLowerCase();
		const searchable = `${c.name || ''} ${c.hash} ${c.description || ''} ${c.deployed_address || ''}`.toLowerCase();
		return searchable.includes(term);
	}), [circuits, query]);

	const formatAddress = (addr: string) => {
		if (addr.length <= 16) return addr;
		return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
	};

	const openInVoyager = (address: string) => {
		window.open(`https://sepolia.voyager.online/contract/${address}`, '_blank');
	};

	return (
		<div className="min-h-screen">
			{/* Header */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-16 -left-10 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
					<div className="absolute -bottom-24 -right-12 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
				</div>
				<div className="container-custom py-12 md:py-12 relative">
					<div className="flex flex-col gap-6">
						<div>
							<h1 className="text-3xl font-bold text-white mb-6">
								Available Circuits
							</h1>
							<p className="text-md text-gray-400 max-w-xl">
								Deployed circuits shared by the community. Pick one and generate a proof with your own inputs. No deployment needed.
							</p>
						</div>
						<div className="flex flex-col md:flex-row md:items-center gap-4">
							<div className="flex-1">
								<input
									className="input"
									placeholder="Search by name, hash, or address"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</div>
							<div className="flex items-center gap-3 text-sm text-gray-400">
								<span className="px-3 py-1 rounded-full bg-dark-800/60 border border-gray-700">
									{filteredCircuits.length === circuits.length
										? `${filteredCircuits.length} circuits`
										: `${filteredCircuits.length} of ${circuits.length} results`}
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Content */}
			<section className="py-12">
				<div className="container-custom">
					{loading && (
						<div className="flex flex-col items-center justify-center py-16">
							<div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
							<p className="text-gray-400">Loading available circuits...</p>
						</div>
					)}

					{!loading && error && (
						<div className="card p-6">
							<p className="text-red-400 font-medium mb-2">Unable to load circuits</p>
							<p className="text-gray-400 text-sm">{error}</p>
						</div>
					)}

					{!loading && !error && filteredCircuits.length === 0 && (
						<div className="text-center py-16">
							<div className="w-16 h-16 rounded-xl bg-dark-700 flex items-center justify-center mx-auto mb-4 opacity-50">
								<svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-300 mb-2">
								{query ? 'No matching circuits' : 'No circuits deployed yet'}
							</h3>
							<p className="text-gray-400 mb-6">
								{query
									? 'Try a different search term.'
									: 'Be the first to deploy a public circuit!'}
							</p>
							{!query && (
								<Link to="/templates/upload" className="btn btn-primary">
									Upload & Deploy
								</Link>
							)}
						</div>
					)}

					{!loading && !error && filteredCircuits.length > 0 && (
						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredCircuits.map((circuit) => (
								<div key={circuit.id} className="card-hover flex flex-col justify-between">
									<div>
										<div className="flex items-center justify-between mb-3">
											<span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
												Deployed
											</span>
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
											<p className="text-gray-400 text-sm mb-2">{circuit.description}</p>
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
										{circuit.deployed_address && (
											<button
												onClick={() => openInVoyager(circuit.deployed_address!)}
												className="text-xs text-gray-500 font-mono mt-1 hover:text-primary transition-colors inline-flex items-center gap-1"
											>
												{formatAddress(circuit.deployed_address)}
												<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
											</button>
										)}
									</div>
									<div className="mt-4 flex items-center justify-between">
										{circuit.code && (
											<button
												onClick={() => navigate('/templates/upload', {
													state: { circuitContent: circuit.code, fileName: (circuit.name || 'circuit') + '.circom' },
												})}
												className="text-gray-400 hover:text-white text-sm transition-colors"
											>
												View source
											</button>
										)}
										<button
										onClick={() => navigate(`/prove/${circuit.hash}`, {
												state: {
													circuit_hash: circuit.hash,
													deployed_address: circuit.deployed_address,
													input_signals: circuit.input_signals,
													input_descriptions: circuit.input_descriptions,
													name: circuit.name,
													from: `/circuits/${circuit.hash}`,
												},
											})}
											disabled={!circuit.deployed_address}
											className="btn btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
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
					)}
				</div>
			</section>
		</div>
	);
};

export default AvailableCircuits;
