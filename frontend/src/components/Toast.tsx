import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
	message: string;
	type: ToastType;
	onClose: () => void;
	duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration }) => {
	const duration_ = duration ?? (type === 'info' ? 3000 : 5000);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(false);
			setTimeout(onClose, 300);
		}, duration_);

		return () => clearTimeout(timer);
	}, [duration_, onClose]);

	const icons = {
		success: (
			<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
			</svg>
		),
		error: (
			<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
			</svg>
		),
		info: (
			<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		),
		warning: (
			<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
		),
	};

	const colors = {
		success: 'bg-green-500/20 border-green-500/50 text-green-400',
		error: 'bg-red-500/20 border-red-500/50 text-red-400',
		info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
		warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
	};

	const iconColors = {
		success: 'bg-green-500/30',
		error: 'bg-red-500/30',
		info: 'bg-blue-500/30',
		warning: 'bg-yellow-500/30',
	};

	return (
		<div
			className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg transition-all duration-300 ${
				colors[type]
			} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
		>
			<div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColors[type]}`}>
				{icons[type]}
			</div>
			<p className="text-sm font-medium max-w-xs">{message}</p>
			<button
				onClick={() => {
					setIsVisible(false);
					setTimeout(onClose, 300);
				}}
				className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
			>
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	);
};

export default Toast;
