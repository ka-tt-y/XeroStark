import React from 'react';

interface SetupStage {
	name: string;
	icon: string;
	hint: string;
}

interface SetupProgressOverlayProps {
	stages: SetupStage[];
	currentStage: number;
	elapsedTime: number;
}

const SetupProgressOverlay: React.FC<SetupProgressOverlayProps> = ({ stages, currentStage, elapsedTime }) => (
	<div className="absolute inset-0 bg-dark-900/95 backdrop-blur-sm flex items-center justify-center rounded-xl">
		<div className="w-full max-w-md px-8">
			{/* Header */}
			<div className="text-center mb-8">
				<div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 relative">
					<span className="text-2xl">{stages[currentStage]?.icon || '⚙️'}</span>
					<div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
				</div>
				<h3 className="text-xl font-semibold text-white mb-1">
					{stages[currentStage]?.name || 'Processing...'}
				</h3>
				<p className="text-gray-400 text-sm">
					Step {currentStage + 1} of {stages.length}
				</p>
				<p className="text-gray-500 text-xs mt-2">
					{stages[currentStage]?.hint || ''}
				</p>
			</div>

			{/* Overall Progress Bar */}
			<div className="mb-6">
				<div className="flex justify-between text-xs text-gray-400 mb-2">
					<span>Overall Progress</span>
					<span>{Math.round(((currentStage) / stages.length) * 100)}%</span>
				</div>
				<div className="h-2 bg-dark-700 rounded-full overflow-hidden">
					<div 
						className="h-full bg-linear-to-r from-primary to-accent-cyan transition-all duration-500 ease-out"
						style={{ width: `${Math.min(((currentStage + 0.5) / stages.length) * 100, 100)}%` }}
					/>
				</div>
			</div>

			{/* Stage List */}
			<div className="space-y-2">
				{stages.map((stage, idx) => {
					const isCompleted = idx < currentStage;
					const isCurrent = idx === currentStage;
					
					return (
						<div 
							key={idx}
							className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
								isCurrent ? 'bg-primary/10 border border-primary/30' : ''
							}`}
						>
							<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
								isCompleted ? 'bg-green-500 text-white' :
								isCurrent ? 'bg-primary text-white' :
								'bg-dark-700 text-gray-500'
							}`}>
								{isCompleted ? (
									<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
									</svg>
								) : (
									<span>{idx + 1}</span>
								)}
							</div>
							<span className={`text-sm flex-1 ${
								isCompleted ? 'text-green-400' :
								isCurrent ? 'text-white font-medium' :
								'text-gray-500'
							}`}>
								{stage.name}
							</span>
							{isCurrent && (
								<div className="w-4 h-4 shrink-0">
									<div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Timer */}
			<div className="text-center mt-6 pt-4 border-t border-gray-800">
				<p className="text-gray-500 text-xs">
					Elapsed: {Math.floor(elapsedTime / 60)}:{String(Math.floor(elapsedTime % 60)).padStart(2, '0')}
				</p>
			</div>
		</div>
	</div>
);

export default SetupProgressOverlay;
