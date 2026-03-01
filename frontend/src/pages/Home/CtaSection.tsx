import React from 'react';
import { Link } from 'react-router-dom';

const CtaSection: React.FC = () => (
	<section className="py-20 bg-dark-800/30">
		<div className="container-custom text-center">
			<h2 className="text-3xl font-bold text-white mb-4">Ready to Build?</h2>
			<p className="text-gray-400 max-w-lg mx-auto mb-8">
				Connect your wallet and start generating verifiable proofs in minutes.
			</p>
			<div className="flex flex-wrap justify-center gap-4">
				<Link to="/templates/upload" className="btn btn-primary">Upload a Circuit</Link>
				<Link to="/docs" className="btn btn-secondary">Read the Docs</Link>
			</div>
		</div>
	</section>
);

export default CtaSection;
