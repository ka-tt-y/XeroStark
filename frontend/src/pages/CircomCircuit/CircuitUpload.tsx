import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setup, registerDeployment } from '../../api';
import { useAccount } from '@starknet-react/core';
import { useTheme } from '../../contexts/ThemeContext';
import Breadcrumb from '../../components/Breadcrumb';
import Toast, { ToastType } from '../../components/Toast';
import { PAYMASTER_DETAILS } from '../../paymaster';
import { defaultDeployer } from 'starknet';
import ProgressSteps from './components/ProgressSteps';
import UploadZone from './components/UploadZone';
import CircuitPreview from './components/CircuitPreview';
import UploadSidebar from './components/UploadSidebar';
import ExistingDeploymentModal from './components/ExistingDeploymentModal';

// Event-driven setup stages (progress is set explicitly, not by time)
const SETUP_STAGES = [
	{ name: 'Compiling circuit & declaring contract', icon: '⚙️', hint: 'Server is compiling your circuit, running Groth16 setup, building the verifier contract, and declaring it on Starknet.' },
	{ name: 'Deploying contract (Gasfree!)', icon: '🚀', hint: 'Approve the deploy transaction in your wallet to create a contract instance on Starknet.' },
	{ name: 'Registering deployment', icon: '✅', hint: 'Saving deployment details to the database.' },
];

interface SetupResponse {
	success: boolean;
	message: string;
	circuit_hash?: string;
	input_signals?: string[];
	input_descriptions?: Record<string, string>;
	output_signals?: string[];
	output_descriptions?: Record<string, string>;
	class_hash?: string;
	deployed_address?: string;
}

interface ExistingDeploymentInfo {
	circuit_hash: string;
	deployed_address: string;
	input_signals?: string[];
	input_descriptions?: Record<string, string>;
}

interface ToastState {
	show: boolean;
	message: string;
	type: ToastType;
}

const CircuitUpload: React.FC = () => {
	const { theme } = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [circuitContent, setCircuitContent] = useState<string>('');
	const [dragActive, setDragActive] = useState(false);
	const [validating, setValidating] = useState(false);
	const [setupLoading, setSetupLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [setupResult, setSetupResult] = useState<SetupResponse | null>(null);
	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
	const { address, account } = useAccount();
	const [hasIncludes, setHasIncludes] = useState(false);
	const [isPublic, setIsPublic] = useState(true);
	const [existingDeployment, setExistingDeployment] = useState<ExistingDeploymentInfo | null>(null);
	
	// Event-driven progress tracking
	const [currentStage, setCurrentStage] = useState(0);
	const [elapsedTime, setElapsedTime] = useState(0);
	const startTimeRef = useRef<number>(0);

	// Pre-fill from template (Browse Templates → Use This Circuit)
	const templateState = location.state as { circuitContent?: string; fileName?: string; description?: string } | null;
	useEffect(() => {
		if (templateState?.circuitContent) {
			setCircuitContent(templateState.circuitContent);
			setFile(new File([templateState.circuitContent], templateState.fileName || 'template.circom', { type: 'text/plain' }));
			setSuccess(true);
			// Clear location state so refreshing doesn't re-trigger
			window.history.replaceState({}, document.title);
		}
	}, []);

	// Current step: 1 = upload, 2 = validating, 3 = preview, 4 = setup complete
	const currentStep = setupResult ? 4 : success ? 3 : file ? (validating ? 2 : 1) : 0;

	// Elapsed time counter (purely cosmetic — stages are event-driven)
	useEffect(() => {
		if (!setupLoading) {
			setCurrentStage(0);
			setElapsedTime(0);
			return;
		}

		startTimeRef.current = Date.now();
		const interval = setInterval(() => {
			setElapsedTime((Date.now() - startTimeRef.current) / 1000);
		}, 1000);

		return () => clearInterval(interval);
	}, [setupLoading]);

	const showToast = (message: string, type: ToastType) => {
		setToast({ show: true, message, type });
	};

	const hideToast = () => {
		setToast({ ...toast, show: false });
	};

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true);
		} else if (e.type === 'dragleave') {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile.name.endsWith('.circom')) {
				setFile(droppedFile);
				setSuccess(false);
				setCircuitContent('');
				setValidationError(null);
			} else {
				alert('Please upload a .circom file');
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];
			if (selectedFile.name.endsWith('.circom')) {
				setFile(selectedFile);
				setSuccess(false);
				setCircuitContent('');
				setValidationError(null);
			} else {
				alert('Please select a .circom file');
				e.target.value = '';
			}
		}
	};

	const validateCircomSyntax = async (code: string): Promise<boolean> => {
		try {
			const { CircomLexer, ExtendedCircomParser } = await import('@distributedlab/circom-parser');
			const antlr4 = await import('antlr4');
			
			const inputStream = antlr4.CharStreams.fromString(code);
			const lexer = new CircomLexer(inputStream);
			const tokens = new antlr4.CommonTokenStream(lexer);
			const parser = new ExtendedCircomParser("uploaded-circuit", tokens, lexer);
			
			parser.circuit();
			
			if (parser.hasAnyErrors()) {
				const errors = parser.getAllErrors();
				console.error('Circom syntax errors:', errors);
				
				const firstError = errors[0];
				if (firstError) {
					const location = firstError.line !== undefined && firstError.column !== undefined
						? `at line ${firstError.line}:${firstError.column}`
						: '';
					setValidationError(`Syntax error ${location}: ${firstError.message || 'Invalid Circom code'}`);
				} else {
					setValidationError('Invalid Circom syntax detected');
				}
				return false;
			}
			
			return true;
		} catch (err: unknown) {
			console.error('Validation error:', err);
			setValidationError(err instanceof Error ? err.message : 'Failed to parse circuit. Invalid Circom syntax.');
			return false;
		}
	};

	const handleUpload = async () => {
		if (!file) return;
		setValidationError(null);
		setValidating(true);

		try {
			const content = await file.text();

			const includePattern = /^\s*include\s+["'][^"']+["']\s*;/gm;
			const detectedIncludes = includePattern.test(content);
			setHasIncludes(detectedIncludes);

			if (detectedIncludes) {
				if (!content.includes('template') && !content.includes('component')) {
					setValidationError('Circuit must contain at least one template or component definition.');
					return;
				}
			} else {
				const isValid = await validateCircomSyntax(content);
				if (!isValid) return;
			}

			setCircuitContent(content);
			setSuccess(true);
		} catch (error: unknown) {
			console.error('Upload failed:', error);
			setValidationError(error instanceof Error ? error.message : 'Failed to load circuit. Please try again.');
		} finally {
			setValidating(false);
		}
	};

	const resetAll = () => {
		setFile(null);
		setCircuitContent('');
		setSuccess(false);
		setValidationError(null);
		setSetupResult(null);
		setHasIncludes(false);
		setExistingDeployment(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleUseExisting = () => {
		if (!existingDeployment) return;
		navigate(`/prove/${existingDeployment.circuit_hash}`, {
			state: {
				circuit_hash: existingDeployment.circuit_hash,
				deployed_address: existingDeployment.deployed_address,
				input_signals: existingDeployment.input_signals,
				input_descriptions: existingDeployment.input_descriptions,
				from: `/circuits/${existingDeployment.circuit_hash}`,
			},
		});
	};

	const handleGenerateProof = async () => {
		if (!circuitContent) return;

		if (!account) {
			showToast('Please connect your wallet first. You need a Starknet wallet to deploy the verifier contract.', 'error');
			return;
		}

		setSetupLoading(true);
		setCurrentStage(0);
		try {
			const response = await setup(circuitContent, address || undefined, isPublic) as SetupResponse;

			if (!response.success) {
				showToast(response.message || 'Setup failed', 'error');
				setSetupLoading(false);
				return;
			}

			if (response.deployed_address && !response.class_hash) {
				setExistingDeployment({
					circuit_hash: response.circuit_hash!,
					deployed_address: response.deployed_address,
					input_signals: response.input_signals,
					input_descriptions: response.input_descriptions,
				});
				setSetupLoading(false);
				return;
			}

			if (!response.class_hash) {
				showToast('Server did not return a class hash. Please try again.', 'error');
				setSetupLoading(false);
				return;
			}

			const classHash = response.class_hash;

			setCurrentStage(1);
			showToast('Please approve the deploy transaction in your wallet...', 'info');

			const { calls: udcCalls, addresses } = defaultDeployer.buildDeployerCall(
				{ classHash, constructorCalldata: [] },
				account.address,
			);

			// Try paymaster (sponsored) deploy with retries — newly declared classes
			// may not be visible on the paymaster's node immediately.
			let deployTxResult: { transaction_hash: string } | null = null;

			for (let attempt = 1; attempt <= 3; attempt++) {
				try {
					deployTxResult = await account.executePaymasterTransaction(
						udcCalls,
						PAYMASTER_DETAILS,
					);
					break; // success
				} catch (err: unknown) {
					const payErr = err instanceof Error ? err : new Error(String(err));
					const msg = payErr.message;

					// Don't retry user rejections
					if (msg.includes('User abort') || msg.includes('user rejected') || msg.includes('User rejected')) {
						throw payErr;
					}

					if (attempt < 3) {
						console.warn(`Paymaster attempt ${attempt}/3 failed, retrying in ${attempt * 5}s...`, msg);
						showToast(`Deploy attempt ${attempt} failed — retrying in ${attempt * 5}s...`, 'info');
						await new Promise(r => setTimeout(r, attempt * 5000));
					} else {
						throw payErr;
					}
				}
			}

			const deployTxHash = deployTxResult!.transaction_hash;

			setToast(prev => ({ ...prev, show: false }));

			const receipt = await account.waitForTransaction(deployTxHash) as any;
			const contractAddress = addresses[0] ?? defaultDeployer.parseDeployerEvent(receipt).contract_address;

			setCurrentStage(2);
			await registerDeployment({
				circuit_hash: response.circuit_hash!,
				class_hash: classHash,
				contract_address: contractAddress,
				tx_hash: deployTxHash,
				deployed_by: address,
			});

			showToast('Circuit setup and deployment completed successfully!', 'success');

			navigate(`/prove/${response.circuit_hash}`, {
				state: {
					circuit_hash: response.circuit_hash,
					deployed_address: contractAddress,
					input_signals: response.input_signals,
					input_descriptions: response.input_descriptions,
					output_signals: response.output_signals,
					output_descriptions: response.output_descriptions,
					from: `/circuits/${response.circuit_hash}`,
				}
			});
		} catch (error: unknown) {
			console.error('Setup failed:', error);
			const msg = error instanceof Error ? error.message : 'Failed to setup circuit. Please try again.';
			if (msg.includes('User abort') || msg.includes('user rejected') || msg.includes('User rejected')) {
				showToast('Transaction was rejected in your wallet.', 'error');
			} else if (msg.includes('insufficient') || msg.includes('balance')) {
				showToast('Insufficient STRK balance to cover gas fees. Please fund your wallet and try again.', 'error');
			} else if (msg.includes('TRANSACTION_EXECUTION_ERROR') || msg.includes('execution call was rejected')) {
				showToast('Deploy transaction failed. This can happen if the network is still syncing the declared contract. Please wait a minute and try again.', 'error');
			} else {
				showToast(msg, 'error');
			}
			setSetupLoading(false);
		}
	};

	return (
		<div className="min-h-screen">
			{/* Header Section */}
			<section className="relative overflow-hidden border-b border-gray-800">
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-16 -left-10 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
					<div className="absolute -bottom-24 -right-12 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
				</div>
				<div className="container-custom py-12 relative">
					<Breadcrumb to="/templates/browse" />
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-white mb-2">Upload Circuit</h1>
							<p className="text-gray-400">Add your custom Circom circuit to start generating proofs</p>
						</div>
					</div>
				</div>
			</section>

			<ProgressSteps currentStep={currentStep} />

			{/* Main Content */}
			<section className="py-10">
				<div className="container-custom">
					<div className="grid lg:grid-cols-3 gap-8">
						{/* Left Column - Upload Area */}
						<div className="lg:col-span-2 space-y-6">
							<UploadZone
								file={file}
								dragActive={dragActive}
								validating={validating}
								validationError={validationError}
								success={success}
								onDrag={handleDrag}
								onDrop={handleDrop}
								onFileChange={handleFileChange}
								onValidate={handleUpload}
								onReset={resetAll}
							/>

							<CircuitPreview
								file={file}
								circuitContent={circuitContent}
								theme={theme}
								hasIncludes={hasIncludes}
								isPublic={isPublic}
								setupResult={setupResult}
								setupLoading={setupLoading}
								setupStages={SETUP_STAGES}
								currentStage={currentStage}
								elapsedTime={elapsedTime}
								account={account}
								templateDescription={templateState?.description}
								onTogglePublic={() => setIsPublic(!isPublic)}
								onGenerateProof={handleGenerateProof}
								onReset={resetAll}
							/>
						</div>

						{/* Right Column - Info */}
						<UploadSidebar />
					</div>
				</div>
			</section>

			{/* Toast Notification */}
			{toast.show && (
				<Toast message={toast.message} type={toast.type} onClose={hideToast} />
			)}

			{/* Existing Deployment Modal */}
			{existingDeployment && (
				<ExistingDeploymentModal
					deployment={existingDeployment}
					onUseExisting={handleUseExisting}
					onDismiss={() => setExistingDeployment(null)}
				/>
			)}
		</div>
	);
};

export default CircuitUpload;
