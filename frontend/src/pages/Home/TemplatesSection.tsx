import React from 'react';
import { Link } from 'react-router-dom';

interface TemplateCircuit {
	path: string;
	name: string;
	description?: string;
}

interface TemplateSectionProps {
	templates: TemplateCircuit[];
	loadingTemplate: string | null;
	onUseTemplate: (template: TemplateCircuit) => void;
}

const TemplatesSection: React.FC<TemplateSectionProps> = ({ templates, loadingTemplate, onUseTemplate }) => (
	<section className="py-20 bg-dark-800/30">
		<div className="container-custom">
			<div className="flex items-center justify-between mb-12">
				<div>
					<h2 className="text-3xl font-bold text-white mb-2">Circuit Templates</h2>
					<p className="text-gray-400">Verified circuits from Circomlib ready to use</p>
				</div>
				<Link to="/templates/browse" className="text-primary hover:text-primary-light flex items-center space-x-2 transition-colors">
					<span>View All</span>
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>
			</div>

			{templates.length > 0 ? (
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{templates.map((t) => (
						<div key={t.path} className="card-hover flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-3">
									<span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">Circom</span>
									<span className="text-xs text-gray-500 truncate max-w-[50%]">{t.path}</span>
								</div>
								<h3 className="text-lg font-semibold text-white mb-2">{t.name}</h3>
								<p className="text-gray-400 text-sm line-clamp-2">
									{t.description
										? t.description.length > 120
											? t.description.slice(0, 120).replace(/\s+\S*$/, '') + '…'
											: t.description
										: 'Explore the circuit source and use it in your proof workflows.'}
								</p>
							</div>
							<div className="mt-5 flex items-center justify-between">
								<Link
									to={`/templates/${encodeURI(t.path)}`}
									state={{ description: t.description }}
									className="text-gray-400 hover:text-white text-sm transition-colors"
								>
									View source
								</Link>
								<button
									onClick={() => onUseTemplate(t)}
									disabled={loadingTemplate === t.path}
									className="btn btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
								>
									{loadingTemplate === t.path ? (
										<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									) : (
										<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
										</svg>
									)}
									Use Template
								</button>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="card animate-pulse">
							<div className="h-4 bg-dark-700 rounded w-1/3 mb-4"></div>
							<div className="h-5 bg-dark-700 rounded w-2/3 mb-3"></div>
							<div className="h-4 bg-dark-700 rounded w-full mb-2"></div>
							<div className="h-4 bg-dark-700 rounded w-4/5"></div>
						</div>
					))}
				</div>
			)}
		</div>
	</section>
);

export default TemplatesSection;
