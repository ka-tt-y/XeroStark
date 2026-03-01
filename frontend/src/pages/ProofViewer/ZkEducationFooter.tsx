import React from 'react';
import { Link } from 'react-router-dom';

const ZkEducationFooter: React.FC = () => (
	<div className="rounded-xl border border-gray-800/50 bg-linear-to-br from-primary/5 via-dark-800 to-dark-800 p-6 text-center">
		<div className="max-w-md mx-auto">
			<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
				<svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
			</div>
			<h3 className="font-semibold text-white text-sm mb-1">What is a zero-knowledge proof?</h3>
			<p className="text-xs text-gray-400 leading-relaxed mb-4">
				ZK proofs let you prove something is true without showing the underlying data.
				Like proving you're over 18 without showing your birthdate.
			</p>
			<Link to="/templates" className="btn btn-primary inline-flex items-center gap-2 text-sm">
				Create your own proof
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
				</svg>
			</Link>
		</div>
	</div>
);

export default ZkEducationFooter;
