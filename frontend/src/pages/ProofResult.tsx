import React from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';

interface ProveResponse {
	success: boolean;
	message: string;
	verifier_address?: string;
	public_signals?: string;
	proof?: string;
	circuit_hash?: string;
	proof_id?: number;
}

interface LocationState {
	result?: ProveResponse;
	error?: string;
	circuit_hash: string;
	deployed_address: string;
	input_signals?: string[];
	output_signals?: string[];
	output_descriptions?: Record<string, string>;
	from?: string;
}

const ProofResult: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { circuitHash } = useParams<{ circuitHash: string }>();
	const state = location.state as LocationState | null;
	const resolvedHash = circuitHash || state?.circuit_hash || '';

	if (!resolvedHash || !state?.deployed_address) {
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

	const formatAddress = (address: string) => {
		if (address.length <= 20) return address;
		return `${address.slice(0, 10)}...${address.slice(-8)}`;
	};

	const openInVoyager = (address: string) => {
		window.open(`https://sepolia.voyager.online/contract/${address}`, '_blank');
	};

	const hasError = Boolean(state.error);

	return (
		<div className="min-h-screen">
			<section className="py-8">
				<div className="container-custom max-w-5xl">
					<Breadcrumb to={state.from || '/templates'} />

					{hasError ? (
						<div className="max-w-2xl mt-2">
							<h1 className="text-2xl font-bold text-white mb-1">Proof Generation Failed</h1>
							<p className="text-gray-400 text-sm mb-6">Something went wrong while generating your proof.</p>

							<div className="card p-0 overflow-hidden border-red-500/30">
								<div className="px-5 py-4 border-b border-red-500/20 bg-red-500/10">
									<h3 className="font-semibold text-white text-sm flex items-center gap-2">
										<svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Error Details
									</h3>
								</div>
								<div className="p-5">
									<p className="text-sm text-red-300 leading-relaxed">{state.error}</p>
								</div>
							</div>

							<div className="flex gap-3 mt-5">
								<button onClick={() => navigate(-1)} className="btn btn-secondary">
									← Back to Inputs
								</button>
								<Link to="/templates/upload" className="btn btn-primary">
									Upload New Circuit
								</Link>
							</div>
						</div>
					) : (
						<div className="grid lg:grid-cols-5 gap-6 mt-2">
							{/* Left column — proof details (3/5) */}
							<div className="lg:col-span-3 space-y-5">
								<div>
									<div className="flex items-center gap-2 mb-1">
										<div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
											<svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
										</div>
										<h1 className="text-2xl font-bold text-white">Proof Generated</h1>
									</div>
									<p className="text-gray-400 text-sm">Your zero-knowledge proof is ready. Publish it on-chain to make it verifiable.</p>
								</div>

								{/* Public Signals */}
								<div className="card p-0 overflow-hidden">
									<div className="px-5 py-4 border-b border-gray-700 bg-dark-800/50">
										<h3 className="font-semibold text-white text-sm">Public Signals</h3>
										<p className="text-xs text-gray-500 mt-0.5">Values visible on-chain after verification</p>
									</div>
									<div className="p-5 space-y-4">
										{/* Annotated output signals (when descriptions are available) */}
										{state.output_signals && state.output_signals.length > 0 && state.output_descriptions && Object.keys(state.output_descriptions).length > 0 && (() => {
											let parsedSignals: string[] = [];
											try {
												parsedSignals = JSON.parse(state.result?.public_signals || '[]');
											} catch {
												// fall through to raw display
											}
											if (parsedSignals.length === 0) return null;
											return (
												<div className="space-y-3">
													{state.output_signals!.map((signal, idx) => (
														<div key={signal} className="p-3 rounded-lg bg-dark-900 border border-gray-800">
															<div className="flex items-baseline justify-between mb-1">
																<span className="text-sm font-medium text-primary font-mono">{signal}</span>
																{state.output_descriptions![signal] && (
																	<span className="text-xs text-gray-500 ml-2 max-w-[60%]">{state.output_descriptions![signal]}</span>
																)}
															</div>
															<p className="font-mono text-sm text-white break-all">
																{parsedSignals[idx] !== undefined ? parsedSignals[idx] : '—'}
															</p>
														</div>
													))}
												</div>
											);
										})()}

										{/* Raw JSON fallback */}
										<details className={state.output_signals && state.output_signals.length > 0 && state.output_descriptions && Object.keys(state.output_descriptions).length > 0 ? 'mt-2' : ''}>
											<summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
												{state.output_descriptions && Object.keys(state.output_descriptions).length > 0 ? 'View raw JSON' : 'Raw public signals'}
											</summary>
											<pre className="mt-2 p-4 bg-dark-900 rounded-lg text-sm text-gray-300 font-mono overflow-x-auto border border-gray-800 whitespace-pre-wrap break-all">
												{state.result?.public_signals}
											</pre>
										</details>
									</div>
								</div>

								{/* Actions */}
								<div className="flex gap-3">
									<button
									onClick={() => navigate(`/proof/verify/${resolvedHash}`, {
										state: {
											circuit_hash: resolvedHash,
												deployed_address: state.deployed_address,
												proof: state.result?.proof,
												public_signals: state.result?.public_signals,
											},
										})}
										className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2"
										disabled={!state.result?.proof || !state.result?.public_signals}
									>
										<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
										</svg>
										Publish Proof On-Chain
									</button>
									<button
										onClick={() => navigate(-1)}
										className="btn btn-secondary"
									>
										← Back
									</button>
								</div>
							</div>

							{/* Right column — context sidebar (2/5) */}
							<div className="lg:col-span-2 space-y-5 mt-19 ml-10">
								{/* Verifier Contract */}
								<div className="card p-0 overflow-hidden">
									<div className="px-5 py-4 border-b border-gray-700 bg-dark-800/50">
										<h3 className="font-semibold text-white text-sm">Verifier Contract</h3>
									</div>
									<div className="p-5">
										<div className="flex items-center gap-3 mb-3">
											<div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
												<svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											</div>
											<div className="min-w-0">
												<p className="text-xs text-gray-500">Starknet Sepolia</p>
												<p className="font-mono text-sm text-white truncate">{formatAddress(state.deployed_address)}</p>
											</div>
										</div>
										<button
											onClick={() => openInVoyager(state.deployed_address)}
											className="w-full text-xs text-gray-400 hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-700 hover:border-primary/40"
										>
											<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
											</svg>
											View on Voyager
										</button>
									</div>
								</div>

								{/* What is this */}
								<div className="card p-5 border-green-500/20 bg-green-500/5">
									<div className="flex items-start gap-3">
										<svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<div>
											<h4 className="text-xs font-semibold text-green-400 mb-1">What is this proof?</h4>
											<p className="text-xs text-gray-400 leading-relaxed">
												This cryptographic proof demonstrates you know the correct inputs <strong className="text-gray-300">without revealing them</strong>. Publish it on-chain so anyone can verify its validity.
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>
		</div>
	);
};

export default ProofResult;
