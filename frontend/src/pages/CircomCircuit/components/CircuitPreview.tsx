import React from 'react';
import Editor from '@monaco-editor/react';
import SetupProgressOverlay from './SetupProgressOverlay';

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

interface SetupStage {
	name: string;
	icon: string;
	hint: string;
}

interface CircuitPreviewProps {
	file: File | null;
	circuitContent: string;
	theme: string;
	hasIncludes: boolean;
	isPublic: boolean;
	setupResult: SetupResponse | null;
	setupLoading: boolean;
	setupStages: SetupStage[];
	currentStage: number;
	elapsedTime: number;
	account: unknown;
	templateDescription?: string;
	onTogglePublic: () => void;
	onGenerateProof: () => void;
	onReset: () => void;
}

const CircuitPreview: React.FC<CircuitPreviewProps> = ({
	file,
	circuitContent,
	theme,
	hasIncludes,
	isPublic,
	setupResult,
	setupLoading,
	setupStages,
	currentStage,
	elapsedTime,
	account,
	templateDescription,
	onTogglePublic,
	onGenerateProof,
	onReset,
}) => {
	if (!circuitContent) return null;

	return (
		<>
			{/* Template Description */}
			{templateDescription && (
				<div className="card p-4 border-purple-500/30 bg-purple-500/5">
					<div className="flex items-start gap-3">
						<div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
							<svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
						</div>
						<div>
							<h4 className="text-sm font-semibold text-purple-300 mb-1">About this template</h4>
							<p className="text-sm text-gray-400 leading-relaxed">{templateDescription}</p>
						</div>
					</div>
				</div>
			)}

			{/* Monaco Editor Preview */}
			<div className="card p-0 overflow-hidden relative">
				<div className="p-4 border-b border-gray-700 bg-dark-800/50 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
							<svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div>
							<h3 className="font-semibold text-white">{file?.name}</h3>
							<p className="text-xs text-gray-400">Valid Circom circuit</p>
						</div>
					</div>
					<button
						onClick={onReset}
						className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						Upload New
					</button>
				</div>

				{/* External dependencies banner */}
				{hasIncludes && (
					<div className="mx-4 mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
						<div className="flex items-start gap-2">
							<svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div>
								<p className="text-sm font-medium text-blue-400">External dependencies detected</p>
								<p className="text-xs text-gray-400 mt-1">
									This circuit uses <code className="text-blue-300">include</code> statements. 
									Standard circomlib templates are fully supported and will be resolved 
									automatically during compilation. Client-side syntax validation was skipped.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Editor */}
				<div className="border-b border-gray-700">
					<Editor
						height="450px"
						defaultLanguage="circom"
						value={circuitContent}
						theme={theme === 'dark' ? 'circom-dark' : 'circom-light'}
						options={{
							readOnly: true,
							minimap: { enabled: false },
							scrollBeyondLastLine: false,
							fontSize: 13,
							lineNumbers: 'on',
							padding: { top: 16 },
						}}
						beforeMount={(monaco) => {
							monaco.languages.register({ id: 'circom' });
							monaco.languages.setMonarchTokensProvider('circom', {
								tokenizer: {
									root: [
										[/\b(pragma|circom|template|component|signal|var|input|output|public|function|return|if|else|for|while|do|include|assert|log)\b/, 'keyword'],
										[/\/\/.*$/, 'comment'],
										[/\/\*/, 'comment', '@comment'],
										[/"([^"\\\\]|\\\\.)*$/, 'string.invalid'],
										[/"/, 'string', '@string'],
										[/\d+/, 'number'],
										[/[{}()\[\]]/, '@brackets'],
										[/[<>!~?:&|+\-*\/\^%]+/, 'operator'],
									],
									comment: [
										[/[^\/*]+/, 'comment'],
										[/\*\//, 'comment', '@pop'],
										[/[\/*]/, 'comment'],
									],
									string: [
										[/[^\\"]+/, 'string'],
										[/\\\\./, 'string.escape'],
										[/"/, 'string', '@pop'],
									],
								},
							});

							monaco.editor.defineTheme('circom-dark', {
								base: 'vs-dark',
								inherit: true,
								rules: [
									{ token: 'keyword', foreground: 'C792EA', fontStyle: 'bold' },
									{ token: 'comment', foreground: '6A9955' },
									{ token: 'string', foreground: 'CE9178' },
									{ token: 'number', foreground: 'B5CEA8' },
								],
								colors: {
									'editor.background': '#0d0d0d',
								},
							});

							monaco.editor.defineTheme('circom-light', {
								base: 'vs',
								inherit: true,
								rules: [
									{ token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
									{ token: 'comment', foreground: '008000' },
									{ token: 'string', foreground: 'A31515' },
									{ token: 'number', foreground: '098658' },
								],
								colors: {
									'editor.background': '#ffffff',
								},
							});
						}}
					/>
				</div>

				{/* Footer area — toggle + action buttons */}
				<div className="p-4 bg-dark-800/30">
					{/* Public/Private Toggle — only show for user-uploaded circuits, not browse templates */}
					{!setupResult && !setupLoading && !templateDescription && (
						<div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-dark-800/50 border border-gray-700">
							<div className="flex items-center gap-2">
								<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{isPublic ? (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									) : (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									)}
								</svg>
								<div>
									<p className="text-sm font-medium text-white">{isPublic ? 'Public Circuit' : 'Private Circuit'}</p>
									<p className="text-xs text-gray-500">
										{isPublic
											? 'Others can see and reuse this circuit'
											: 'Only you can see this circuit'}
									</p>
								</div>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={isPublic}
								onClick={onTogglePublic}
								className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
									isPublic ? 'bg-primary' : 'bg-gray-600'
								}`}
							>
								<span
									className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
										isPublic ? 'translate-x-5' : 'translate-x-0'
									}`}
								/>
							</button>
						</div>
					)}

					{setupResult ? (
						<div className="space-y-4">
							<div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
								<div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
									Deployed Successfully
								</div>
								<div className="space-y-1 text-xs">
									<p className="text-gray-400">
										<span className="text-gray-500">Contract:</span>{' '}
										<span className="font-mono text-gray-300">{setupResult.deployed_address?.slice(0, 10)}...{setupResult.deployed_address?.slice(-8)}</span>
									</p>
									<p className="text-gray-400">
										<span className="text-gray-500">Hash:</span>{' '}
										<span className="font-mono text-gray-300">{setupResult.circuit_hash?.slice(0, 16)}...</span>
									</p>
								</div>
							</div>
							<div className="flex gap-2">
								<button className="btn btn-primary flex-1 text-sm inline-flex items-center justify-center gap-2">
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Verify Proof
								</button>
								<button
									onClick={onReset}
									className="btn btn-secondary text-sm"
								>
									New Circuit
								</button>
							</div>
						</div>
					) : (
						<div className="flex flex-col sm:flex-row gap-3">
							<button
								onClick={onGenerateProof}
								disabled={setupLoading}
								className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2"
							>
								{setupLoading ? (
									<>
										<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										<span>Setting up circuit...</span>
									</>
								) : (
									<>
										<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										{account ? 'Setup & Deploy' : 'Connect Wallet to Deploy'}
									</>
								)}
							</button>
							<button
								onClick={onReset}
								disabled={setupLoading}
								className="btn btn-secondary inline-flex items-center justify-center gap-2"
							>
								Cancel
							</button>
						</div>
					)}
				</div>

				{/* Loading Overlay */}
				{setupLoading && (
					<SetupProgressOverlay
						stages={setupStages}
						currentStage={currentStage}
						elapsedTime={elapsedTime}
					/>
				)}
			</div>
		</>
	);
};

export default CircuitPreview;
