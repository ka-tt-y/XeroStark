import React from 'react';
import { Link } from 'react-router-dom';

type BreadcrumbProps = {
	to: string;
	label?: string;
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ to, label = 'Back' }) => {
	return (
		<Link
			to={to}
			className="text-sm text-gray-400 px-2 py-1 hover:text-white transition-colors inline-flex items-center gap-1 mb-1"
		>
			<span>←</span>
			<span>{label}</span>
		</Link>
	);
};

export default Breadcrumb;
