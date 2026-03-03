import React from 'react';

interface InputSignalsFormProps {
	inputSignals: string[];
	inputValues: Record<string, string>;
	inputDescriptions: Record<string, string>;
	loading: boolean;
	onInputChange: (signal: string, value: string) => void;
	onSubmit: () => void;
	autoFilledSignals?: Record<string, string>; // signal -> display label e.g. "523 STRK from wallet"
	balanceFetching?: boolean;
}

const InputSignalsForm: React.FC<InputSignalsFormProps> = ({
	inputSignals,
	inputValues,
	inputDescriptions,
	loading,
	onInputChange,
	onSubmit,
	autoFilledSignals,
	balanceFetching,
}) => (
	<div className="card p-0 overflow-hidden">
		<div className="px-5 py-4 border-b border-gray-700 bg-dark-800/50">
			<h3 className="font-semibold text-white text-sm">Input Signals</h3>
			<p className="text-xs text-gray-500 mt-0.5">
				{inputSignals.length > 0
					? `${inputSignals.length} input${inputSignals.length > 1 ? 's' : ''} required`
					: 'Enter your circuit inputs'}
			</p>
		</div>
		<div className="p-5">
			{inputSignals.length > 0 ? (
				<div className="space-y-4 mb-5">
					{inputSignals.map((signal) => (
						<div key={signal}>
							<label className="flex items-baseline justify-between mb-1.5">
								<span className="text-sm font-medium text-primary font-mono">{signal}</span>
								{inputDescriptions[signal] && (
									<span className="text-xs text-gray-500 ml-2 max-w-[50%]">{inputDescriptions[signal]}</span>
								)}
							</label>
							<input
								type="text"
								value={inputValues[signal] || ''}
								onChange={(e) => onInputChange(signal, e.target.value)}
								placeholder={inputDescriptions[signal] || `Enter value for ${signal}`}
								className="w-full p-2.5 bg-dark-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
								disabled={loading}
							/>
							{balanceFetching && signal === 'balance' && (
								<div className="flex items-center gap-1.5 mt-1.5">
									<div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
									<span className="text-xs text-gray-500">Fetching wallet balance...</span>
								</div>
							)}
							{autoFilledSignals?.[signal] && !balanceFetching && (
								<div className="flex items-center gap-1.5 mt-1.5">
									<svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
									<span className="text-xs text-green-400/80">{autoFilledSignals[signal]}</span>
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-5">
					<p className="text-sm text-yellow-300">
						No input signals detected. Please check your circuit definition.
					</p>
				</div>
			)}

			<button
				onClick={onSubmit}
				disabled={loading || inputSignals.length === 0 || Object.values(inputValues).some(v => !v.trim())}
				className="btn btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
			>
				{loading ? (
					<>
						<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
						Generating Proof...
					</>
				) : (
					<>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						Generate Proof
					</>
				)}
			</button>
		</div>
	</div>
);

export default InputSignalsForm;
