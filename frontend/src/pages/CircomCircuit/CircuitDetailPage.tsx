import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCircuitDetails, CircuitDetails } from '../../api';
import Breadcrumb from '../../components/Breadcrumb';

const formatAddress = (addr: string) => {
	if (addr.length <= 16) return addr;
	return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
};

const CircuitDetailPage: React.FC = () => {
	const { circuitHash } = useParams<{ circuitHash: string }>();
	const navigate = useNavigate();
	const [circuit, setCircuit] = useState<CircuitDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!circuitHash) {
			setError('No circuit hash provided.');
			setLoading(false);
			return;
		}

		let active = true;
		setLoading(true);
		setError(null);

		getCircuitDetails(circuitHash)
			.then((data) => {
				if (active) setCircuit(data);
			})
			.catch((err) => {
				if (active) setError(err.message || 'Failed to load circuit details.');
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => { active = false; };
	}, [circuitHash]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
					<p className="text-gray-400">Loading circuit details...</p>
				</div>
			</div>
		);
	}

	if (error || !circuit) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-400 mb-4">Error</h2>
					<p className="text-gray-400 mb-6">{error || 'Circuit not found.'}</p>
					<Link to="/circuits" className="btn btn-primary">
						Browse Circuits
					</Link>
				</div>
			</div>
		);
	}

	const handleGenerateProof = () => {
		navigate(`/prove/${circuitHash}`, {
			state: {
				circuit_hash: circuit.circuit_hash,
				deployed_address: circuit.deployed_address,
				input_signals: circuit.input_signals,
				input_descriptions: circuit.input_descriptions,
				output_signals: circuit.output_signals,
				output_descriptions: circuit.output_descriptions,
				name: circuit.name,
				from: `/circuits/${circuitHash}`,
			},
		});
	};

	return (
		<div className="min-h-screen">
			<section className="relative overflow-hidden border-b border-gray-800">
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-16 -left-10 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
					<div className="absolute -bottom-24 -right-12 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
				</div>
				<div className="container-custom py-12 relative">
					<Breadcrumb to="/circuits" label="Available Circuits" />
					<h1 className="text-3xl font-bold text-white mb-2">
						{circuit.name || `Circuit ${formatAddress(circuit.circuit_hash)}`}
					</h1>
					{circuit.description && (
						<p className="text-gray-400 max-w-2xl">{circuit.description}</p>
					)}
				</div>
			</section>

			<section className="py-10">
				<div className="container-custom max-w-4xl">
					<div className="grid md:grid-cols-2 gap-8">
						{/* Left: Info */}
						<div className="space-y-6">
							{/* Status */}
							<div className="card p-5">
								<h3 className="text-sm font-semibold text-white mb-4">Deployment Status</h3>
								{circuit.deployed_address ? (
									<div className="flex items-center gap-3">
										<span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0"></span>
										<div>
											<p className="text-sm text-green-400 font-medium">Deployed on Starknet Sepolia</p>
											<button
												onClick={() => window.open(`https://sepolia.voyager.online/contract/${circuit.deployed_address}`, '_blank')}
												className="text-xs text-gray-500 font-mono hover:text-primary transition-colors inline-flex items-center gap-1 mt-1"
											>
												{formatAddress(circuit.deployed_address)}
												<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
											</button>
										</div>
									</div>
								) : (
									<div className="flex items-center gap-3">
										<span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0"></span>
										<p className="text-sm text-yellow-400">Not deployed yet</p>
									</div>
								)}
							</div>

							{/* Circuit Hash */}
							<div className="card p-5">
								<h3 className="text-sm font-semibold text-white mb-2">Circuit Hash</h3>
								<p className="text-xs text-gray-400 font-mono break-all">{circuit.circuit_hash}</p>
							</div>
						</div>

						{/* Right: Signals + Action */}
						<div className="space-y-6">
							{/* Input Signals */}
							{circuit.input_signals && circuit.input_signals.length > 0 && (
								<div className="card p-5">
									<h3 className="text-sm font-semibold text-white mb-3">Input Signals</h3>
									<div className="space-y-2">
										{circuit.input_signals.map((sig) => (
											<div key={sig} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50">
												<span className="text-sm text-gray-300 font-mono">{sig}</span>
												{circuit.input_descriptions?.[sig] && (
													<span className="text-xs text-gray-500 max-w-[60%] text-right">{circuit.input_descriptions[sig]}</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Output Signals */}
							{circuit.output_signals && circuit.output_signals.length > 0 && (
								<div className="card p-5">
									<h3 className="text-sm font-semibold text-white mb-3">Output Signals</h3>
									<div className="space-y-2">
										{circuit.output_signals.map((sig) => (
											<div key={sig} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50">
												<span className="text-sm text-gray-300 font-mono">{sig}</span>
												{circuit.output_descriptions?.[sig] && (
													<span className="text-xs text-gray-500 max-w-[60%] text-right">{circuit.output_descriptions[sig]}</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Generate Proof Button */}
							{circuit.deployed_address && (
								<button
									onClick={handleGenerateProof}
									className="btn btn-primary w-full py-3 text-base font-semibold inline-flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
									</svg>
									Generate Proof
								</button>
							)}
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default CircuitDetailPage;
