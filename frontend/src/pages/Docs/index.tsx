import React, { useState } from 'react';
import DocsSidebar, { type DocSection } from './DocsSidebar';
import DocsContent from './DocsContent';

const Docs: React.FC = () => {
	const [active, setActive] = useState<DocSection>('overview');

	return (
		<div className="min-h-screen">
			{/* Header */}
			<section className="relative overflow-hidden border-b border-gray-800">
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-16 -left-10 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
					<div className="absolute -bottom-24 -right-12 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
				</div>
				<div className="container-custom py-12 relative">
					<h1 className="text-3xl font-bold text-white mb-5">Documentation</h1>
					<p className="text-gray-400">
						Everything you need to know about Xerostark.
					</p>
				</div>
			</section>

			{/* Content */}
			<section className="py-10">
				<div className="container-custom">
					<div className="flex flex-col lg:flex-row gap-8">
						<DocsSidebar active={active} onSelect={setActive} />
						<DocsContent active={active} />
					</div>
				</div>
			</section>
		</div>
	);
};

export default Docs;
