import React from 'react';

interface ProveSidebarProps {
	deployedAddress: string;
}

const formatAddress = (address: string) => {
	if (address.length <= 20) return address;
	return `${address.slice(0, 10)}...${address.slice(-8)}`;
};

const ProveSidebar: React.FC<ProveSidebarProps> = ({ deployedAddress }) => (
	<div className="lg:col-span-2 space-y-5 mt-19 ml-10">
		{/* Verifier Contract */}
		<div className="card p-0 overflow-hidden">
			<div className="px-5 py-4 border-b border-gray-700 bg-dark-800/50">
				<h3 className="font-semibold text-white text-sm">Verifier Contract</h3>
			</div>
			<div className="p-5">
				<div className="flex items-center gap-3 mb-3">
					<div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
						<svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div className="min-w-0">
						<p className="text-xs text-gray-500">Deployed on Starknet Sepolia</p>
						<p className="font-mono text-sm text-white truncate">{formatAddress(deployedAddress)}</p>
					</div>
				</div>
				<button
					onClick={() => window.open(`https://sepolia.voyager.online/contract/${deployedAddress}`, '_blank')}
					className="w-full text-xs text-gray-400 hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-700 hover:border-primary/40"
				>
					<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
					View on Voyager
				</button>
			</div>
		</div>

		{/* How it works */}
		<div className="card p-5 border-green-500/20 bg-green-500/5">
			<div className="flex items-start gap-3">
				<svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<h4 className="text-xs font-semibold text-green-400 mb-1">Privacy Preserved</h4>
					<p className="text-xs text-gray-400 leading-relaxed">
						Your inputs stay private. The proof demonstrates you know the correct values <strong className="text-gray-300">without revealing them</strong>.
					</p>
				</div>
			</div>
		</div>
	</div>
);

export default ProveSidebar;
