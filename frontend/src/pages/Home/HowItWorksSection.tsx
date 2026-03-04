import React from 'react';

const HOW_IT_WORKS_STEPS = [
	{ step: '1', title: 'Write or Choose', desc: 'Pick a circuit template from Circomlib, use a community-shared circuit, or upload your own .circom file.' },
	{ step: '2', title: 'Compile & Declare', desc: 'The platform compiles your circuit, generates a Groth16 verifier contract using Garaga, and declares it on Starknet.' },
	{ step: '3', title: 'Deploy Verifier', desc: 'Confirm a single gasless transaction in your wallet to deploy the verifier contract on-chain.' },
	{ step: '4', title: 'Generate Proof', desc: 'Enter your private inputs. The platform generates a ZK proof and the calldata for verification.' },
	{ step: '5', title: 'Verify & Share', desc: 'Submit the proof on-chain — gasless. Once verified, share a public link anyone can audit.' },
];

const HowItWorksSection: React.FC = () => (
	<section className="py-20 border-b border-gray-800">
		<div className="container-custom">
			<div className="text-center mb-14">
				<h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
				<p className="text-gray-400 max-w-xl mx-auto">
					From circuit to on-chain verification in five steps.
				</p>
			</div>
			<div className="grid md:grid-cols-5 gap-4">
				{HOW_IT_WORKS_STEPS.map((item) => (
					<div key={item.step} className="card text-center relative">
						<div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 mx-auto mb-4">
							<span className="text-primary font-bold text-sm">{item.step}</span>
						</div>
						<h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
						<p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
					</div>
				))}
			</div>
		</div>
	</section>
);

export default HowItWorksSection;
