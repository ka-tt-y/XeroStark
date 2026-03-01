import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchGitHubRepoContents, fetchContent } from '../../api';
import Breadcrumb from '../../components/Breadcrumb';

type CircuitFile = {
	path: string;
	name: string;
	description?: string;
};

const CircuitList: React.FC = () => {
	const navigate = useNavigate();
	const [circuits, setCircuits] = useState<CircuitFile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState('');
	const [loadingCircuit, setLoadingCircuit] = useState<string | null>(null);

	// Pagination
	const PAGE_SIZE = 12;
	const [currentPage, setCurrentPage] = useState(1);

	const handleUseTemplate = async (circuit: CircuitFile) => {
		try {
			setLoadingCircuit(circuit.path);
			const content = await fetchContent(circuit.path);
			navigate('/templates/upload', {
				state: { circuitContent: typeof content === 'string' ? content : String(content ?? ''), fileName: circuit.name, description: circuit.description },
			});
		} catch {
			// fallback: just navigate to detail page
			navigate(`/templates/${encodeURI(circuit.path)}`);
		} finally {
			setLoadingCircuit(null);
		}
	};

	useEffect(() => {
		let isActive = true;

		const loadCircuits = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await fetchGitHubRepoContents();
				if (!isActive) return;

				const normalized: CircuitFile[] = Array.isArray(data)
					? data.map((item: any) => ({
						path: String(item.path ?? ''),
						name: String(item.name ?? item.path ?? 'Unknown'),
						description: item.description ?? undefined,
					}))
					: [];

				setCircuits(normalized);
			} catch (err: unknown) {
				if (!isActive) return;
				setError(err instanceof Error ? err.message : 'Unable to load circuits.');
			} finally {
				if (isActive) setLoading(false);
			}
		};

		loadCircuits();
		return () => {
			isActive = false;
		};
	}, []);

	const filteredCircuits = useMemo(() => {
		const term = query.trim().toLowerCase();
		if (!term) return circuits;
		return circuits.filter((circuit) =>
			`${circuit.name} ${circuit.path} ${circuit.description || ''}`.toLowerCase().includes(term),
		);
	}, [circuits, query]);

	// Reset to page 1 when search query changes
	useEffect(() => {
		setCurrentPage(1);
	}, [query]);

	const totalPages = Math.max(1, Math.ceil(filteredCircuits.length / PAGE_SIZE));
	const paginatedCircuits = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return filteredCircuits.slice(start, start + PAGE_SIZE);
	}, [filteredCircuits, currentPage]);

	// Generate page numbers to show (max 5 with ellipsis)
	const getPageNumbers = () => {
		const pages: (number | '...')[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (currentPage > 3) pages.push('...');
			for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
				pages.push(i);
			}
			if (currentPage < totalPages - 2) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	};

	return (
		<div className="min-h-screen">
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-16 -left-10 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
					<div className="absolute -bottom-24 -right-12 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
				</div>
				<div className="container-custom py-16 md:py-20 relative">
					<Breadcrumb to="/templates" />
					<div className="flex flex-col gap-6">
						<div>
							<h1 className="text-4xl md:text-3xl font-bold text-white mb-2">
								Circom Templates
							</h1>
							<p className="text-lg text-gray-400 max-w-2xl">
								Browse verified circuits from <a href="https://github.com/iden3/circomlib" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark">Circomlib</a> and community-deployed templates.
							</p>
						</div>
						<div className="flex flex-col md:flex-row md:items-center gap-4">
							<div className="flex-1">
								<input
									className="input"
									placeholder="Search circuits by name or path"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
								/>
							</div>
							<div className="flex items-center gap-3 text-sm text-gray-400">
								<span className="px-3 py-1 rounded-full bg-dark-800/60 border border-gray-700">
									{filteredCircuits.length === circuits.length
										? `${filteredCircuits.length} circuits`
										: `${filteredCircuits.length} of ${circuits.length} results`}
								</span>
								{totalPages > 1 && (
									<span className="px-3 py-1 rounded-full bg-dark-800/60 border border-gray-700">
										Page {currentPage}/{totalPages}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="py-12">
				<div className="container-custom">
					{loading && (
						<div className="card">
							<p className="text-gray-300">Loading circuits from the Server...</p>
						</div>
					)}

					{!loading && error && (
						<div className="card">
							<p className="text-red-400 font-medium mb-2">Unable to load circuits</p>
							<p className="text-gray-400 text-sm">{error}</p>
						</div>
					)}

					{!loading && !error && (
						<>
							<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
								{paginatedCircuits.map((circuit) => (
									<div key={circuit.path} className="card-hover flex flex-col justify-between">
										<div>
											<div className="flex items-center justify-between mb-3">
												{circuit.path.startsWith('user/') ? (
													<span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
														Community
													</span>
												) : (
													<span className="text-xs text-gray-500">Circom</span>
												)}
												<span className="text-xs text-gray-500 truncate max-w-[50%]">
													{circuit.path.startsWith('user/') ? 'User uploaded' : circuit.path}
												</span>
											</div>
											<h3 className="text-xl font-semibold text-white mb-2">
												{circuit.name}
											</h3>
											<p className="text-gray-400 text-sm line-clamp-2">
												{circuit.description
													? circuit.description.length > 120
														? circuit.description.slice(0, 120).replace(/\s+\S*$/, '') + '…'
														: circuit.description
													: 'Inspect the circuit source and reuse it for your proof flows.'}
											</p>
										</div>
										<div className="mt-6 flex items-center justify-between">
											<Link
												to={`/templates/${encodeURI(circuit.path)}`}
												state={{ description: circuit.description }}
												className="text-gray-400 hover:text-white text-sm transition-colors"
											>
												View source
											</Link>
											<button
												onClick={() => handleUseTemplate(circuit)}
												disabled={loadingCircuit === circuit.path}
												className="btn btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
											>
												{loadingCircuit === circuit.path ? (
													<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
												) : (
													<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
													</svg>
												)}
												Use Template
											</button>
										</div>
									</div>
								))}
							</div>

							{/* Pagination Controls */}
							{totalPages > 1 && (
								<div className="flex items-center justify-center gap-2 mt-10">
									<button
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
										disabled={currentPage === 1}
										className="btn btn-secondary text-sm px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
									>
										<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
										</svg>
									</button>

									{getPageNumbers().map((page, idx) =>
										page === '...' ? (
											<span key={`ellipsis-${idx}`} className="px-2 text-gray-500 text-sm">…</span>
										) : (
											<button
												key={page}
												onClick={() => setCurrentPage(page as number)}
												className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${currentPage === page
														? 'bg-primary text-white'
														: 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700 border border-gray-700'
													}`}
											>
												{page}
											</button>
										)
									)}

									<button
										onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
										disabled={currentPage === totalPages}
										className="btn btn-secondary text-sm px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
									>
										<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
									</button>

									<span className="text-xs text-gray-500 ml-3">
										Page {currentPage} of {totalPages}
									</span>
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
};

export default CircuitList;
