import React, { useEffect, useMemo, useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { RpcProvider } from 'starknet';
import { prove, getCircuitDetails } from '../../api';
import Breadcrumb from '../../components/Breadcrumb';
import Toast, { ToastType } from '../../components/Toast';
import InputSignalsForm from './components/InputSignalsForm';
import ProveSidebar from './components/ProveSidebar';
import PoseidonHelper from './components/PoseidonHelper';

// STRK token on Starknet Sepolia
const STRK_TOKEN = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const SEPOLIA_RPC = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/tPHqpWiSDDnnkqtpd3QEy';

async function fetchSTRKBalance(walletAddress: string): Promise<{ raw: string; display: string }> {
	const provider = new RpcProvider({ nodeUrl: SEPOLIA_RPC });
	const result = await provider.callContract({
		contractAddress: STRK_TOKEN,
		entrypoint: 'balance_of',
		calldata: [walletAddress],
	});
	const resultArr = Array.isArray(result) ? result : (result as any).result || [];
	const low = BigInt(resultArr[0] || '0');
	const high = BigInt(resultArr[1] || '0');
	const balanceWei = low + (high << 128n);
	// Convert to whole STRK (18 decimals)
	const wholeStrk = balanceWei / (10n ** 18n);
	const remainder = (balanceWei % (10n ** 18n)) / (10n ** 16n); // 2 decimal places
	const display = `${wholeStrk}.${remainder.toString().padStart(2, '0')} STRK`;
	return { raw: wholeStrk.toString(), display };
}

interface ProveResponse {
	success: boolean;
	message: string;
	public_signals?: string;
	proof?: string;
	circuit_hash?: string;
	proof_id?: number;
}

interface LocationState {
	circuit_hash: string;
	deployed_address: string;
	input_signals?: string[];
	input_descriptions?: Record<string, string>;
	output_signals?: string[];
	output_descriptions?: Record<string, string>;
	name?: string;
	from?: string;
}

interface ToastState {
	show: boolean;
	message: string;
	type: ToastType;
}

const Prove: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { circuitHash } = useParams<{ circuitHash: string }>();
	const state_ = location.state as LocationState | null;

	const resolvedHash = circuitHash || state_?.circuit_hash || '';
	
	// State for fetched circuit data
	const [fetchedData, setFetchedData] = useState<{
		deployed_address: string;
		input_signals: string[];
		input_descriptions: Record<string, string>;
		output_signals: string[];
		output_descriptions: Record<string, string>;
		name: string | null;
	} | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [fetchLoading, setFetchLoading] = useState(false);

	// Fetch circuit data if not passed via state
	useEffect(() => {
		if (!state_?.deployed_address && resolvedHash) {
			setFetchLoading(true);
			getCircuitDetails(resolvedHash)
				.then((data) => {
					if (data.deployed_address) {
						setFetchedData({
							deployed_address: data.deployed_address,
							input_signals: data.input_signals || [],
							input_descriptions: data.input_descriptions || {},
							output_signals: data.output_signals || [],
							output_descriptions: data.output_descriptions || {},
							name: data.name || null,
						});
					} else {
						setFetchError('Circuit is not deployed yet. Please complete setup first.');
					}
				})
				.catch((err) => {
					setFetchError(err.message || 'Failed to load circuit data');
				})
				.finally(() => setFetchLoading(false));
		}
	}, [resolvedHash, state_?.deployed_address]);

	const state = state_?.deployed_address ? state_ : fetchedData ? {
		circuit_hash: resolvedHash,
		deployed_address: fetchedData.deployed_address,
		input_signals: fetchedData.input_signals,
		input_descriptions: fetchedData.input_descriptions,
		output_signals: fetchedData.output_signals,
		output_descriptions: fetchedData.output_descriptions,
		name: fetchedData.name ?? undefined,
	} : null;

	const circuitName = state?.name || null;

	// Detect if circuit uses Poseidon (check signal names for hash-related keywords)
	const showPoseidonHelper = useMemo(() => {
		const signals = state?.input_signals || [];
		const keywords = ['hash', 'commitment', 'secret', 'password', 'poseidon', 'nullifier'];
		return signals.some(s => keywords.some(k => s.toLowerCase().includes(k)));
	}, [state?.input_signals]);

	const signalsKey = state?.input_signals?.join('|') ?? '';

	const initialInputs = useMemo(() => {
		return state?.input_signals?.reduce((acc, signal) => {
			acc[signal] = '';
			return acc;
		}, {} as Record<string, string>) || {};
	}, [signalsKey]);

	const [inputValues, setInputValues] = useState<Record<string, string>>(initialInputs);
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
	const { address } = useAccount();

	const inputDescriptions = useMemo<Record<string, string>>(() => {
		if (state?.input_descriptions && typeof state.input_descriptions === 'object') {
			return state.input_descriptions;
		}
		return {};
	}, [state?.input_descriptions]);

	useEffect(() => {
		setInputValues(initialInputs);
	}, [initialInputs]);

	// Auto-fetch STRK balance when circuit has a "balance" input signal
	const [autoFilledSignals, setAutoFilledSignals] = useState<Record<string, string>>({});
	const [balanceFetching, setBalanceFetching] = useState(false);

	useEffect(() => {
		const hasBalanceSignal = state?.input_signals?.includes('balance');
		if (!hasBalanceSignal || !address) return;

		let active = true;
		setBalanceFetching(true);

		fetchSTRKBalance(address)
			.then(({ raw, display }) => {
				if (!active) return;
				setInputValues(prev => ({ ...prev, balance: raw }));
				setAutoFilledSignals(prev => ({ ...prev, balance: `${display} from connected wallet` }));
			})
			.catch((err) => {
				console.warn('Failed to fetch STRK balance:', err);
			})
			.finally(() => {
				if (active) setBalanceFetching(false);
			});

		return () => { active = false; };
	}, [address, signalsKey]);

	// Loading state while fetching circuit data
	if (fetchLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
					<p className="text-gray-400">Loading circuit data...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (fetchError) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-400 mb-4">Error</h2>
					<p className="text-gray-400 mb-6">{fetchError}</p>
					<Link to="/templates" className="btn btn-primary">
						Browse Templates
					</Link>
				</div>
			</div>
		);
	}

	if (!resolvedHash || !state?.deployed_address) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-white mb-4">No circuit data found</h2>
					<p className="text-gray-400 mb-6">Please upload and setup a circuit first.</p>
					<Link to="/templates/upload" className="btn btn-primary">
						Upload Circuit
					</Link>
				</div>
			</div>
		);
	}

	const showToast = (message: string, type: ToastType) => {
		setToast({ show: true, message, type });
	};

	const hideToast = () => {
		setToast({ ...toast, show: false });
	};

	const buildResultState = (extra: Record<string, unknown>) => ({
		circuit_hash: resolvedHash,
		deployed_address: state!.deployed_address,
		input_signals: state!.input_signals,
		output_signals: state!.output_signals,
		output_descriptions: state!.output_descriptions,
		from: state!.from,
		...extra,
	});

	const handleGenerateProof = async () => {
		const emptyInputs = Object.entries(inputValues).filter(([_, value]) => !value.trim());
		if (emptyInputs.length > 0) {
			showToast(`Please fill in all input fields: ${emptyInputs.map(([k]) => k).join(', ')}`, 'error');
			return;
		}

		try {
			setLoading(true);
			const response = await prove({
				circuit_hash: resolvedHash,
				inputs: inputValues,
				created_by: address || undefined,
			}) as ProveResponse;

			if (response.success) {
				navigate(`/proof/result/${resolvedHash}`, {
					state: buildResultState({ result: response }),
				});
			} else {
				navigate(`/proof/result/${resolvedHash}`, {
					state: buildResultState({ error: response.message || 'Proof generation failed' }),
				});
			}
		} catch (error: unknown) {
			console.error('Prove failed:', error);
			navigate(`/proof/result/${resolvedHash}`, {
				state: buildResultState({
					error: error instanceof Error ? error.message : 'Failed to generate proof. Please try again.',
				}),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (signal: string, value: string) => {
		setInputValues(prev => ({ ...prev, [signal]: value }));
	};

	return (
		<div className="min-h-screen">
			<section className="py-8">
				<div className="container-custom max-w-5xl">
					<Breadcrumb to={state.from || '/templates'} />

					<div className="grid lg:grid-cols-5 gap-6 mt-2">
						<div className="lg:col-span-3 space-y-5">
							<div>
								<h1 className="text-2xl font-bold text-white mb-1">
									Generate Proof{circuitName ? ` — ${circuitName}` : ''}
								</h1>
								<p className="text-gray-400 text-sm">Provide your private inputs to generate a zero-knowledge proof.</p>
							</div>

							<InputSignalsForm
								inputSignals={state.input_signals || []}
								inputValues={inputValues}
								inputDescriptions={inputDescriptions}
								loading={loading}
								onInputChange={handleInputChange}
								onSubmit={handleGenerateProof}
								autoFilledSignals={autoFilledSignals}
								balanceFetching={balanceFetching}
							/>
						</div>

						<ProveSidebar deployedAddress={state.deployed_address} />
					</div>

					{/* Poseidon Hash Helper — full-width below the form */}
					{showPoseidonHelper && <PoseidonHelper />}
				</div>
			</section>

			{toast.show && (
				<Toast message={toast.message} type={toast.type} onClose={hideToast} />
			)}
		</div>
	);
};

export default Prove;
