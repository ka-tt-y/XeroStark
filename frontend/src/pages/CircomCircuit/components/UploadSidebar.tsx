import React from 'react';
import { Link } from 'react-router-dom';

const UploadSidebar: React.FC = () => (
	<div className="space-y-4">
		<div className="card p-4">
			<div className="flex items-center gap-2 mb-3">
				<div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
					<svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h4 className="text-sm font-semibold text-white">Requirements</h4>
			</div>
			<ul className="text-xs text-gray-400 space-y-2">
				<li className="flex items-center gap-1.5">
					<svg className="w-3 h-3 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
					</svg>
					Valid .circom file
				</li>
				<li className="flex items-center gap-1.5">
					<svg className="w-3 h-3 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
					</svg>
					Max 10 MB
				</li>
				<li className="flex items-center gap-1.5">
					<svg className="w-3 h-3 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
					</svg>
					Pass syntax check
				</li>
			</ul>
		</div>

		<div className="card p-4">
			<div className="flex items-center gap-2 mb-3">
				<div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
					<svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<h4 className="text-sm font-semibold text-white">Workflow</h4>
			</div>
			<ol className="text-xs text-gray-400 space-y-2">
				<li className="flex items-center gap-1.5">
					<span className="w-4 h-4 rounded-full bg-dark-700 flex items-center justify-center text-[10px] text-gray-500 shrink-0">1</span>
					Upload & validate circuit
				</li>
				<li className="flex items-center gap-1.5">
					<span className="w-4 h-4 rounded-full bg-dark-700 flex items-center justify-center text-[10px] text-gray-500 shrink-0">2</span>
					Compile & deploy verifier
				</li>
				<li className="flex items-center gap-1.5">
					<span className="w-4 h-4 rounded-full bg-dark-700 flex items-center justify-center text-[10px] text-gray-500 shrink-0">3</span>
					Generate & verify proofs
				</li>
			</ol>
		</div>

		<div className="card p-4 bg-linear-to-br from-primary/10 to-accent-pink/10 border-primary/30">
			<h4 className="text-sm font-semibold text-white mb-1">Need Templates?</h4>
			<p className="text-xs text-gray-400 mb-3">
				Browse verified circuits from Circomlib.
			</p>
			<Link
				to="/templates/browse"
				className="text-primary text-xs font-medium inline-flex items-center gap-1 hover:gap-1.5 transition-all"
			>
				Browse Templates
				<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
				</svg>
			</Link>
		</div>
	</div>
);

export default UploadSidebar;
