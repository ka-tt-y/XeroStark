import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchContent, fetchGitHubRepoContents } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';
import Breadcrumb from '../../components/Breadcrumb';

const CircuitDetail: React.FC = () => {
	const { theme } = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();
	const wildcardParam = params['*'] ?? '';
	const path = useMemo(() => {
		try {
			return wildcardParam ? decodeURI(wildcardParam) : '';
		} catch {
			return wildcardParam ?? '';
		}
	}, [wildcardParam]);
	const fileName = useMemo(() => path.split('/').pop() ?? 'Circuit', [path]);

	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [description, setDescription] = useState<string | null>(
		(location.state as { description?: string } | null)?.description ?? null
	);
	const hasInitialDescription = useRef(description !== null);
	const [useTemplateLoading, setUseTemplateLoading] = useState(false);

	useEffect(() => {
		let isActive = true;

		const loadContent = async () => {
			if (!path) {
				setError('Missing circuit path.');
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				const data = await fetchContent(path);
				if (!isActive) return;

				setContent(typeof data === 'string' ? data : String(data ?? ''));

				// If description wasn't passed via location state, fetch from circuit list
				if (!hasInitialDescription.current) {
					try {
						const circuits = await fetchGitHubRepoContents();
						if (!isActive) return;
						const match = Array.isArray(circuits)
							? circuits.find((c: { path?: string }) => c.path === path)
							: null;
						if (match?.description) {
							setDescription(match.description);
						}
					} catch {
						// Non-critical — description is optional
					}
				}
			} catch (err: unknown) {
				if (!isActive) return;
				setError(err instanceof Error ? err.message : 'Unable to load circuit content.');
			} finally {
				if (isActive) setLoading(false);
			}
		};

		loadContent();
		return () => {
			isActive = false;
		};
	}, [path]);

	const handleCopy = async () => {
		if (!content) return;
		try {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};

	const handleUseTemplate = () => {
		if (!content) return;
		setUseTemplateLoading(true);
		navigate('/templates/upload', {
			state: { circuitContent: content, fileName, description: description ?? undefined },
		});
	};

	const handleEditorMount = (_editor: any, monaco: any) => {
		// Register Circom language
		monaco.languages.register({ id: 'circom' });

		// Set tokenizer rules
		monaco.languages.setMonarchTokensProvider('circom', {
			keywords: [
				'pragma', 'circom', 'component', 'signal', 'input', 'output', 'public',
				'private', 'var', 'return', 'if', 'else', 'for', 'while', 'function',
				'template', 'constraint'
			],
			typeKeywords: ['Number'],
			operators: ['=', '==', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/', '%', '**', '&&', '||', '!'],
			symbols: /[=><!~?:&|+\-*/%^]+/,
			escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
			digits: /\d+(_+\d+)*/,
			octaldigits: /[0-7]+(_+[0-7]+)*/,
			hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

			tokenizer: {
				root: [
					[/[a-z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
					[/[A-Z][\w\$]*/, 'type.identifier'],
					{ include: '@whitespace' },
					[/\/\*/, 'comment', '@comment'],
					[/\/\/.*$/, 'comment'],
					[/"(?:\\.|[^"\\])*"/, 'string'],
					[/'(?:\\.|[^'\\])*'/, 'string'],
					[/0[xX][0-9a-fA-F_]*[0-9a-fA-F]/, 'number.hex'],
					[/\d+/, 'number'],
					[/[{}()\[\]]/, '@brackets'],
					[/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
					[/[;,.]/, 'delimiter'],
				],
				comment: [
					[/[^\/*]+/, 'comment'],
					[/\/\*/, 'comment', '@push'],
					[/\*\//, 'comment', '@pop'],
					[/[\/*]/, 'comment'],
				],
				whitespace: [
					[/[ \t\r\n]+/, 'white'],
				],
			},
		});

		// Define theme colors for Circom
		monaco.editor.defineTheme('circom-dark', {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'keyword', foreground: 'C586C0' },
				{ token: 'comment', foreground: '6A9955' },
				{ token: 'string', foreground: 'CE9178' },
				{ token: 'number', foreground: 'B5CEA8' },
				{ token: 'type.identifier', foreground: '4EC9B0' },
			],
			colors: {
				'editor.background': '#1a1a2e',
				'editor.foreground': '#e8e8e8',
			},
		});

		monaco.editor.defineTheme('circom-light', {
			base: 'vs',
			inherit: true,
			rules: [
				{ token: 'keyword', foreground: '0000FF' },
				{ token: 'comment', foreground: '008000' },
				{ token: 'string', foreground: 'A31515' },
				{ token: 'number', foreground: '098658' },
				{ token: 'type.identifier', foreground: '267CB9' },
			],
			colors: {
				'editor.background': '#FFFFFF',
				'editor.foreground': '#000000',
			},
		});
	};

	return (
		<div className="min-h-screen">
			<section className="relative overflow-hidden py-8">
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-20 -left-8 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
					<div className="absolute -bottom-24 -right-10 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
				</div>
				<div className="container-custom relative">
					<div className="flex items-center justify-between">
						<div>
							<Breadcrumb to="/templates/browse" label="Browse Templates" />
							<h1 className="text-2xl md:text-3xl font-bold text-white">{fileName}</h1>
						</div>
						<div className="flex items-center gap-3">
							<div className="inline-flex items-center px-3 py-1 bg-dark-800/50 border border-gray-700 rounded-full backdrop-blur-sm">
								<span className="text-xs text-gray-300">From Circomlib</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="py-8">
				<div className="container-custom">
					{loading && (
						<div className="card">
							<p className="text-gray-300">Loading circuit...</p>
						</div>
					)}

					{!loading && error && (
						<div className="card">
							<p className="text-red-400 font-medium mb-2">Unable to load circuit</p>
							<p className="text-gray-400 text-sm">{error}</p>
						</div>
					)}

					{!loading && !error && (
						<div className="space-y-6">
							{/* Description Card */}
							{description && (
								<div className="card p-6 bg-linear-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
									<div className="flex items-start gap-3">
										<svg className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<div>
											<h3 className="text-sm font-semibold text-white mb-1">About this circuit</h3>
											<p className="text-sm text-gray-300 leading-relaxed">{description}</p>
										</div>
									</div>
								</div>
							)}

							{/* Source Code Card */}
							<div className="card">
								<div className="flex flex-col gap-4 mb-4">
									<div className="flex items-center justify-between">
										<div>
											<h2 className="text-lg font-semibold text-white">Source Code</h2>
											<p className="text-xs text-gray-500">From <a href="https://github.com/iden3/circomlib" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark">iden3/circomlib</a></p>
										</div>
										<div className="flex items-center gap-2">
											<button onClick={handleCopy} className="btn btn-secondary text-sm">
												{copied ? 'Copied' : 'Copy'}
											</button>
											<button
												onClick={handleUseTemplate}
												disabled={useTemplateLoading}
												className="btn btn-primary text-sm inline-flex items-center gap-1.5"
											>
												{useTemplateLoading ? (
													<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
												) : (
													<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
													</svg>
												)}
												Use Template
											</button>
										</div>
									</div>
								</div>
								<div className="bg-dark-900/70 border border-gray-800 rounded-xl overflow-hidden">
									<Editor
										height="60vh"
										defaultLanguage="circom"
										value={content}
										theme={theme === 'dark' ? 'circom-dark' : 'circom-light'}
										onMount={handleEditorMount}
										options={{
											readOnly: true,
											minimap: { enabled: false },
											scrollBeyondLastLine: false,
											fontSize: 13,
											lineHeight: 20,
											wordWrap: 'on',
											padding: { top: 16, bottom: 16 },
											scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
										}}
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>
		</div>
	);
};

export default CircuitDetail;
