import React from 'react';

interface PublishStage {
	name: string;
	icon: string;
}

interface PublishProgressOverlayProps {
	stages: PublishStage[];
	currentStage: number;
	elapsedTime: number;
}

const PublishProgressOverlay: React.FC<PublishProgressOverlayProps> = ({ stages, currentStage, elapsedTime }) => (
	<div className="absolute inset-0 bg-dark-900/95 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
		<div className="w-full max-w-sm px-6">
			<div className="text-center mb-6">
				<div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3 relative">
					<span className="text-xl">{stages[currentStage]?.icon || '⏳'}</span>
					<div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
				</div>
				<h3 className="text-lg font-semibold text-white mb-0.5">
					{stages[currentStage]?.name || 'Processing...'}
				</h3>
				<p className="text-gray-500 text-xs">
					Step {currentStage + 1} of {stages.length}
				</p>
			</div>

			{/* Progress Bar */}
			<div className="mb-5">
				<div className="flex justify-between text-xs text-gray-500 mb-1.5">
					<span>Progress</span>
					<span>{Math.round(((currentStage + 1) / stages.length) * 100)}%</span>
				</div>
				<div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
					<div
						className="h-full bg-linear-to-r from-cyan-500 to-green-400 transition-all duration-500 ease-out"
						style={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
					/>
				</div>
			</div>

			{/* Stage List */}
			<div className="space-y-1.5">
				{stages.map((stage, idx) => {
					const isCompleted = idx < currentStage;
					const isCurrent = idx === currentStage;

					return (
						<div
							key={idx}
							className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-xs ${
								isCurrent ? 'bg-cyan-500/10 border border-cyan-500/30' : ''
							}`}
						>
							<div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
								isCompleted ? 'bg-green-500 text-white' :
								isCurrent ? 'bg-cyan-500 text-white' :
								'bg-dark-700 text-gray-500'
							}`}>
								{isCompleted ? (
									<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
									</svg>
								) : (
									<span className="text-[10px]">{idx + 1}</span>
								)}
							</div>
							<span className={`flex-1 ${
								isCompleted ? 'text-green-400' :
								isCurrent ? 'text-white font-medium' :
								'text-gray-500'
							}`}>
								{stage.name}
							</span>
							{isCurrent && (
								<div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
							)}
						</div>
					);
				})}
			</div>

			<div className="text-center mt-4 pt-3 border-t border-gray-800">
				<p className="text-gray-500 text-xs">
					Elapsed: {Math.floor(elapsedTime / 60)}:{String(Math.floor(elapsedTime % 60)).padStart(2, '0')}
				</p>
			</div>
		</div>
	</div>
);

export default PublishProgressOverlay;
