import React from 'react';

const WhyZkSection: React.FC = () => (
	<section className="py-20 border-b border-gray-800">
		<div className="container-custom">
			<div className="max-w-7xl">
				<h2 className="text-2xl font-bold text-white mb-3">Prove statements without revealing secrets.</h2>
				<p className="text-gray-400 leading-relaxed mb-10 max-w-2xl">
					Xerostark leverages Starknet's architecture to make zero-knowledge proof verification
					accessible and affordable. Verifier contracts are generated using{' '}
					<strong className="text-white">Garaga</strong> — optimized pairing checks
					in Cairo, Starknet's native smart contract language.
				</p>

				<div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-14">
					{FEATURES.map((f) => (
						<div key={f.title} className="flex gap-3">
							<div className={`w-2 h-2 rounded-full ${f.dotColor} mt-2 shrink-0`}></div>
							<div>
								<p className="text-sm text-white font-medium mb-1 flex items-center gap-2">
									{f.title}
									{f.badge && (
										<span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">{f.badge}</span>
									)}
								</p>
								<p className="text-sm text-gray-400">{f.desc}</p>
							</div>
						</div>
					))}
				</div>

				<div className="grid md:grid-cols-3 gap-5">
					{CARDS.map((c) => (
						<div key={c.title} className="p-5 rounded-xl border border-gray-800 bg-dark-800/40">
							<div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center mb-4`}>
								<svg className={`w-5 h-5 ${c.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.iconPath} />
								</svg>
							</div>
							<h3 className="text-sm font-semibold text-white mb-1.5">{c.title}</h3>
							<p className="text-gray-400 text-sm leading-relaxed">{c.desc}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	</section>
);

const FEATURES = [
	{ title: 'Groth16 on Cairo', dotColor: 'bg-primary', desc: 'Verifier contracts run Groth16 pairing checks natively in Cairo, taking advantage of Starknet\'s efficient field operations.' },
	{ title: 'Low Verification Cost', dotColor: 'bg-accent-blue', desc: 'Starknet\'s validity rollup architecture means on-chain verification is significantly cheaper than on L1 Ethereum.' },
	{ title: 'Permanent & Auditable', dotColor: 'bg-green-400', desc: 'Every verified proof is recorded on-chain. View any verification transaction on Voyager or any Starknet block explorer.' },
	{ title: 'Sepolia Testnet', dotColor: 'bg-accent-pink', desc: 'Currently live on Starknet Sepolia. Connect with Argent or Braavos to start deploying and verifying proofs.' },
	{ title: 'Sponsored Gas', dotColor: 'bg-yellow-400', desc: 'Users can deploy and verify proofs without needing No STRK (sepolia). Gas fees are sponsored by the platform on testnet.' },
	{ title: 'Noir Circuits', dotColor: 'bg-purple-400', badge: 'Coming Soon', desc: 'Support for Noir circuits is on the roadmap — write proofs in Noir and verify them on Starknet alongside Circom.' },
];

const CARDS = [
	{
		title: 'Privacy',
		iconBg: 'bg-primary/20',
		iconColor: 'text-primary',
		iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
		desc: 'Prove you meet criteria — age, balance, membership — without revealing the underlying data.',
	},
	{
		title: 'Trustless Verification',
		iconBg: 'bg-accent-blue/20',
		iconColor: 'text-accent-blue',
		iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
		desc: 'Proofs are verified by smart contracts on Starknet — no trusted third party, just math.',
	},
	{
		title: 'Composable',
		iconBg: 'bg-accent-pink/20',
		iconColor: 'text-accent-pink',
		iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
		desc: 'Verified proofs are on-chain forever. Build applications that consume proof results from other contracts.',
	},
];

export default WhyZkSection;
