import React from 'react';

interface PublicSignalsCardProps {
	publicInputs: any;
	outputSignals?: string[];
	publicInputSignals?: string[];
	outputDescriptions?: Record<string, string>;
	publicInputDescriptions?: Record<string, string>;
	onCopy: (text: string, label: string) => void;
}

const PublicSignalsCard: React.FC<PublicSignalsCardProps> = ({
	publicInputs,
	outputSignals,
	publicInputSignals,
	outputDescriptions,
	publicInputDescriptions,
	onCopy,
}) => {
	const hasLabels = (outputSignals?.length ?? 0) > 0 || (publicInputSignals?.length ?? 0) > 0;

	let parsedSignals: string[] = [];
	try {
		parsedSignals = Array.isArray(publicInputs) ? publicInputs : JSON.parse(publicInputs);
	} catch { /* fall through */ }

	const allLabels: { name: string; description?: string; category: string }[] = [];
	if (hasLabels) {
		for (const name of (outputSignals || [])) {
			allLabels.push({ name, description: outputDescriptions?.[name], category: 'Output' });
		}
		for (const name of (publicInputSignals || [])) {
			allLabels.push({ name, description: publicInputDescriptions?.[name], category: 'Public Input' });
		}
	}

	return (
		<div className="card p-0 overflow-hidden">
			<div className="px-5 py-4 border-b border-gray-700/60 flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-white text-sm">Public Signals</h3>
					<p className="text-xs text-gray-500 mt-0.5">These values are publicly visible — they are the circuit's output</p>
				</div>
				<button
					onClick={() => onCopy(JSON.stringify(publicInputs, null, 2), 'Public signals')}
					className="text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-dark-700"
					title="Copy signals"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
				</button>
			</div>
			<div className="p-5 space-y-3">
				{/* Labeled signals when signal info is available */}
				{hasLabels && parsedSignals.length > 0 && (
					<div className="space-y-3">
						{allLabels.map((label, idx) => (
							<div key={label.name} className="p-3 rounded-lg bg-dark-900 border border-gray-800">
								<div className="flex items-baseline justify-between mb-1">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-primary font-mono">{label.name}</span>
										<span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
											label.category === 'Output'
												? 'bg-green-500/15 text-green-400'
												: 'bg-blue-500/15 text-blue-400'
										}`}>
											{label.category}
										</span>
									</div>
									{label.description && (
										<span className="text-xs text-gray-500 ml-2 max-w-[50%]">{label.description}</span>
									)}
								</div>
								<p className="font-mono text-sm text-white break-all">
									{parsedSignals[idx] !== undefined ? parsedSignals[idx] : '—'}
								</p>
							</div>
						))}
					</div>
				)}

				{/* Raw JSON fallback / details */}
				<details className={hasLabels ? 'mt-2' : ''}>
					<summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
						{hasLabels ? 'View raw JSON' : 'Raw public signals'}
					</summary>
					<pre className="mt-2 p-4 bg-dark-900 rounded-lg text-sm text-gray-300 font-mono overflow-x-auto border border-gray-800/60 whitespace-pre-wrap break-all leading-relaxed">
{JSON.stringify(publicInputs, null, 2)}
					</pre>
				</details>
			</div>
		</div>
	);
};

export default PublicSignalsCard;
