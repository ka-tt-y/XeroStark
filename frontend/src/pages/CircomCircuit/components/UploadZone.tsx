import React, { useRef } from 'react';

interface UploadZoneProps {
	file: File | null;
	dragActive: boolean;
	validating: boolean;
	validationError: string | null;
	success: boolean;
	onDrag: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onValidate: () => void;
	onReset: () => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({
	file,
	dragActive,
	validating,
	validationError,
	success,
	onDrag,
	onDrop,
	onFileChange,
	onValidate,
	onReset,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	if (success) return null;

	return (
		<div className="card p-0 overflow-hidden">
			<div className="p-4 border-b border-gray-700 bg-dark-800/50">
				<h3 className="font-semibold text-white">Circuit File</h3>
			</div>
			<div className="p-6">
				<div
					onDragEnter={onDrag}
					onDragLeave={onDrag}
					onDragOver={onDrag}
					onDrop={onDrop}
					className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
						dragActive
							? 'border-primary bg-primary/10'
							: file
								? 'border-primary/50 bg-primary/5'
								: 'border-gray-700 hover:border-gray-600 bg-dark-800/30'
					}`}
				>
					{file ? (
						<div className="space-y-4">
							<div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto">
								<svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<div>
								<p className="font-medium text-white">{file.name}</p>
								<p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
							</div>
							<button
								onClick={onReset}
								className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
							>
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								Choose different file
							</button>
						</div>
					) : (
						<>
							<div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center mx-auto mb-4">
								<svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
								</svg>
							</div>
							<p className="text-white font-medium mb-1">Drop your .circom file here</p>
							<p className="text-gray-500 text-sm mb-4">or</p>
							<label className="btn btn-secondary inline-flex items-center gap-2 cursor-pointer">
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
								</svg>
								Browse Files
								<input
									ref={fileInputRef}
									type="file"
									accept=".circom"
									onChange={onFileChange}
									className="hidden"
								/>
							</label>
						</>
					)}
				</div>

				{/* Validation Error */}
				{validationError && (
					<div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
						<div className="flex items-start gap-3">
							<div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
								<svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</div>
							<div>
								<p className="text-red-400 text-sm font-medium">Validation Failed</p>
								<p className="text-red-400/80 text-sm mt-1">{validationError}</p>
							</div>
						</div>
					</div>
				)}

				{/* Action Button */}
				{file && !success && (
					<div className="mt-6 flex gap-3">
						<button
							onClick={onValidate}
							disabled={validating}
							className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2"
						>
							{validating ? (
								<>
									<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Validating Syntax...
								</>
							) : (
								<>
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Validate Circuit
								</>
							)}
						</button>
						<button onClick={onReset} className="btn btn-secondary">
							Cancel
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default UploadZone;
