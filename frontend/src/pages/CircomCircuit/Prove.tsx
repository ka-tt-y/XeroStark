import React, { useEffect, useMemo, useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { prove } from '../../api';
import Breadcrumb from '../../components/Breadcrumb';
import Toast, { ToastType } from '../../components/Toast';
import InputSignalsForm from './components/InputSignalsForm';
import ProveSidebar from './components/ProveSidebar';

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
	const state = location.state as LocationState | null;

	const resolvedHash = circuitHash || state?.circuit_hash || '';
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
								<h1 className="text-2xl font-bold text-white mb-1">Generate Proof</h1>
								<p className="text-gray-400 text-sm">Provide your private inputs to generate a zero-knowledge proof.</p>
							</div>

							<InputSignalsForm
								inputSignals={state.input_signals || []}
								inputValues={inputValues}
								inputDescriptions={inputDescriptions}
								loading={loading}
								onInputChange={handleInputChange}
								onSubmit={handleGenerateProof}
							/>
						</div>

						<ProveSidebar deployedAddress={state.deployed_address} />
					</div>
				</div>
			</section>

			{toast.show && (
				<Toast message={toast.message} type={toast.type} onClose={hideToast} />
			)}
		</div>
	);
};

export default Prove;
