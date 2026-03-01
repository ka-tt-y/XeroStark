import React from 'react';

export type DocSection = 'overview' | 'getting-started' | 'circuits' | 'proofs' | 'verification' | 'api' | 'whats-next';

export const sections: { id: DocSection; title: string; icon: string }[] = [
	{ id: 'overview', title: 'Overview', icon: '📖' },
	{ id: 'getting-started', title: 'Getting Started', icon: '🚀' },
	{ id: 'circuits', title: 'Circuits', icon: '⚡' },
	{ id: 'proofs', title: 'Proofs', icon: '🔐' },
	{ id: 'verification', title: 'On-Chain Verification', icon: '✅' },
	{ id: 'api', title: 'API Reference', icon: '🔧' },
	{ id: 'whats-next', title: "What's Next", icon: '🗺️' },
];

interface DocsSidebarProps {
	active: DocSection;
	onSelect: (section: DocSection) => void;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({ active, onSelect }) => (
	<nav className="lg:w-56 flex-shrink-0">
		<ul className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:sticky lg:top-24">
			{sections.map((s) => (
				<li key={s.id}>
					<button
						onClick={() => onSelect(s.id)}
						className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
							active === s.id
								? 'bg-primary/20 text-primary'
								: 'text-gray-400 hover:text-white hover:bg-dark-800'
						}`}
					>
						<span className="mr-2">{s.icon}</span>
						{s.title}
					</button>
				</li>
			))}
		</ul>
	</nav>
);

export default DocsSidebar;
