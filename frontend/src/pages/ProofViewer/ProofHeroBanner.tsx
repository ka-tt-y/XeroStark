import React from 'react';

interface ProofHeroBannerProps {
	circuitName: string;
	circuitType: string;
	formattedDate: string;
	verificationStatus: 'pending' | 'verified' | 'failed';
}

const STATUS_CONFIG = {
	verified: {
		label: 'Verified On-Chain',
		icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
		shieldBg: 'bg-green-500/10 border-green-500/30',
		iconColor: 'text-green-400',
		badgeBg: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/25',
	},
	pending: {
		label: 'Pending Verification',
		icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
		shieldBg: 'bg-yellow-500/10 border-yellow-500/30',
		iconColor: 'text-yellow-400',
		badgeBg: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/25',
	},
	failed: {
		label: 'Verification Failed',
		icon: 'M6 18L18 6M6 6l12 12',
		shieldBg: 'bg-red-500/10 border-red-500/30',
		iconColor: 'text-red-400',
		badgeBg: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25',
	},
};

const ProofHeroBanner: React.FC<ProofHeroBannerProps> = ({
	circuitName,
	circuitType,
	formattedDate,
	verificationStatus,
}) => {
	const status = STATUS_CONFIG[verificationStatus];
	const isVerified = verificationStatus === 'verified';

	return (
		<section className="relative overflow-hidden border-b border-gray-800/60">
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute -top-20 -left-8 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
				<div className="absolute -bottom-24 -right-10 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
			</div>

			<div className="container-custom max-w-3xl relative py-12 text-center">
				{/* Shield icon */}
				<div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center border ${status.shieldBg}`}>
					<svg className={`w-8 h-8 ${status.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={status.icon} />
					</svg>
				</div>

				{/* Status badge */}
				<span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 ${status.badgeBg}`}>
					{isVerified && (
						<span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
					)}
					{status.label}
				</span>

				<h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">{circuitName}</h1>
				<p className="text-gray-400 text-sm">
					<span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
						circuitType === 'circom'
							? 'bg-green-500/15 text-green-400'
							: 'bg-purple-500/15 text-purple-400'
					}`}>
						{circuitType.toUpperCase()}
					</span>
					{formattedDate}
				</p>
			</div>
		</section>
	);
};

export default ProofHeroBanner;
