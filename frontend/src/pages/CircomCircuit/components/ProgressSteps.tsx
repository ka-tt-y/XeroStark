import React from 'react';

interface ProgressStepsProps {
	currentStep: number;
}

const steps = ['Select', 'Validate', 'Preview', 'Deploy'];

const CheckIcon: React.FC = () => (
	<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
	</svg>
);

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep }) => (
	<section className="border-b border-gray-800 bg-dark-900/50">
		<div className="container-custom py-4">
			<div className="flex items-center justify-center gap-3 max-w-xl mx-auto">
				{steps.map((label, idx) => {
					const stepNum = idx + 1;
					const isReached = currentStep >= stepNum;
					const isCompleted = currentStep > stepNum;

					return (
						<React.Fragment key={label}>
							{idx > 0 && (
								<div className={`w-8 h-0.5 ${isReached ? 'bg-primary' : 'bg-gray-700'}`} />
							)}
							<div className={`flex items-center gap-1.5 ${isReached ? 'text-primary' : 'text-gray-500'}`}>
								<div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
									isReached ? 'border-primary bg-primary/20' : 'border-gray-600 bg-dark-800'
								}`}>
									{isCompleted ? <CheckIcon /> : stepNum}
								</div>
								<span className="text-xs font-medium hidden sm:inline">{label}</span>
							</div>
						</React.Fragment>
					);
				})}
			</div>
		</div>
	</section>
);

export default ProgressSteps;
