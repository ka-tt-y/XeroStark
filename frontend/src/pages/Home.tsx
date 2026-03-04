import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStats, getPublicCircuits, fetchGitHubRepoContents, fetchContent } from '../api';

interface PlatformStats {
  total_proofs: number;
  active_circuits: number;
  verified_proofs: number;
  deployments: number;
}

interface FeaturedCircuit {
  id: number;
  hash: string;
  name: string | null;
  description: string | null;
  code: string | null;
  created_by: string | null;
  is_public: boolean | null;
  deployed_address: string | null;
  input_signals: string[] | null;
  input_descriptions: Record<string, string> | null;
}

interface TemplateCircuit {
  path: string;
  name: string;
  description?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [featured, setFeatured] = useState<FeaturedCircuit[]>([]);
  const [templates, setTemplates] = useState<TemplateCircuit[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, publicData, templateData] = await Promise.allSettled([
          getStats(),
          getPublicCircuits(),
          fetchGitHubRepoContents(),
        ]);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (publicData.status === 'fulfilled') setFeatured(Array.isArray(publicData.value) ? publicData.value : []);
        if (templateData.status === 'fulfilled') {
          const all = Array.isArray(templateData.value) ? templateData.value : [];
          // Pick up to 6 templates (ones with descriptions first)
          const withDesc = all.filter((t: TemplateCircuit) => t.description);
          const rest = all.filter((t: TemplateCircuit) => !t.description);
          setTemplates([...withDesc, ...rest].slice(0, 3));
        }
      } catch {
        // Non-critical
      }
    };
    load();
  }, []);

  const handleUseTemplate = async (template: TemplateCircuit) => {
    try {
      setLoadingTemplate(template.path);
      const content = await fetchContent(template.path);
      navigate('/templates/upload', {
        state: { circuitContent: typeof content === 'string' ? content : String(content ?? ''), fileName: template.name, description: template.description },
      });
    } catch {
      navigate(`/templates/${encodeURI(template.path)}`);
    } finally {
      setLoadingTemplate(null);
    }
  };

  const formatAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-5 w-150 h-100 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-20 -right-10 w-150 h-96 bg-blue-600 rounded-full opacity-15 blur-3xl"></div>
        </div>
        <div className="container-custom py-28 relative">

          <h1 className="text-6xl font-bold mb-6 max-w-2xl">
            Verify{' '}
            <span className="gradient-text">Zero-Knowledge Proofs</span>{' '}
            <span className="text-white">on Starknet</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-xl mb-12">
            Compile Circom circuits, deploy verifier contracts, and prove
            statements on-chain — all from your browser with your Starknet wallet.
          </p>

          <div className="flex flex-wrap gap-4 mb-16">
            <Link to="/templates" className="btn btn-primary">
              Explore Circuits
            </Link>
            <Link to="/templates/upload" className="btn btn-secondary">
              Upload Your Circuit
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 md:gap-12">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats ? stats.total_proofs.toLocaleString() : '—'}</div>
                <div className="text-sm text-gray-400">Proofs Generated</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-accent-pink/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats ? stats.active_circuits.toLocaleString() : '—'}</div>
                <div className="text-sm text-gray-400">Active Circuits</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats ? stats.verified_proofs.toLocaleString() : '—'}</div>
                <div className="text-sm text-gray-400">Verified On-Chain</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why ZK Proofs Section */}
      <section className="py-20 border-b border-gray-800">
        <div className="container-custom">
          <div className="max-w-7xl">
            <h2 className="text-2xl font-bold text-white mb-3">Prove statements without revealing secrets.</h2>
            <p className="text-gray-400 leading-relaxed mb-10 max-w-2xl">
              Xerostark leverages Starknet's architecture to make zero-knowledge proof verification
              accessible and affordable. Verifier contracts are generated using{' '}
              <strong className="text-white">Garaga</strong> — optimized pairing checks
              in Cairo, Starknet's native smart contract language.
            </p>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-14">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">Groth16 on Cairo</p>
                  <p className="text-sm text-gray-400">Verifier contracts run Groth16 pairing checks natively in Cairo, taking advantage of Starknet's efficient field operations.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-blue mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">Low Verification Cost</p>
                  <p className="text-sm text-gray-400">Starknet's validity rollup architecture means on-chain verification is significantly cheaper than on L1 Ethereum.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">Permanent & Auditable</p>
                  <p className="text-sm text-gray-400">Every verified proof is recorded on-chain. View any verification transaction on Voyager or any Starknet block explorer.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-pink mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">Sepolia Testnet</p>
                  <p className="text-sm text-gray-400">Currently live on Starknet Sepolia. Connect with Argent or Braavos to start deploying and verifying proofs.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">Sponsored Gas</p>
                  <p className="text-sm text-gray-400">Users can deploy and verify proofs without needing No STRK (sepolia). Gas fees are sponsored by the platform on testnet.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm text-white font-medium mb-1 flex items-center gap-2">Noir Circuits <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">Coming Soon</span></p>
                  <p className="text-sm text-gray-400">Support for Noir circuits is on the roadmap — write proofs in Noir and verify them on Starknet alongside Circom.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl border border-gray-800 bg-dark-800/40">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">Privacy</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Prove you meet criteria — age, balance, membership — without
                  revealing the underlying data.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-gray-800 bg-dark-800/40">
                <div className="w-9 h-9 rounded-lg bg-accent-blue/20 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">Trustless Verification</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Proofs are verified by smart contracts on Starknet — no trusted
                  third party, just math.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-gray-800 bg-dark-800/40">
                <div className="w-9 h-9 rounded-lg bg-accent-pink/20 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-accent-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">Composable</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Verified proofs are on-chain forever. Build applications that
                  consume proof results from other contracts.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 border-b border-gray-800">
        <div className="container-custom">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From circuit to on-chain verification in five steps.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              {
                step: '1',
                title: 'Write or Choose',
                desc: 'Pick a circuit template from Circomlib, use a community-shared circuit, or upload your own .circom file.',
              },
              {
                step: '2',
                title: 'Compile & Declare',
                desc: 'The Platform compiles your circuit, generates a Groth16 verifier contract, and declares it on Starknet.',
              },
              {
                step: '3',
                title: 'Deploy Verifier',
                desc: 'Confirm a single transaction in your wallet to deploy the verifier contract on-chain.',
              },
              {
                step: '4',
                title: 'Generate Proof',
                desc: 'Enter your private inputs. The Platform generates a ZK proof and the calldata for verification.',
              },
              {
                step: '5',
                title: 'Verify & Share',
                desc: 'Submit the proof on-chain. Once verified, share a public link anyone can audit.',
              },
            ].map((item) => (
              <div key={item.step} className="card text-center relative">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 mx-auto mb-4">
                  <span className="text-primary font-bold text-sm">{item.step}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Templates Section — from backend */}
      <section className="py-20 bg-dark-800/30">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Circuits</h2>
              <p className="text-gray-400">Ready to use deployed circuits by the community</p>
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
                      onClick={() => handleUseTemplate(t)}
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

      {/* Community Circuits Section */}
      {featured.length > 0 && (
        <section className="py-20 border-b border-gray-800">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  Community Circuits
                  <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-dark-800 border border-gray-700 rounded-full">
                    {featured.length}
                  </span>
                </h2>
                <p className="text-gray-400">Circuits shared by the community — ready to generate proofs</p>
              </div>
              <Link to="/circuits" className="text-primary hover:text-primary-light flex items-center space-x-2 transition-colors">
                <span>View All</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((circuit) => (
                <div key={circuit.id} className="card-hover flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {circuit.deployed_address ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          Deployed
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Public
                        </span>
                      )}
                      {circuit.created_by && (
                        <span className="text-xs text-gray-500 font-mono">
                          {formatAddress(circuit.created_by)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {circuit.name || `Circuit ${formatAddress(circuit.hash)}`}
                    </h3>
                    {circuit.description && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">{circuit.description}</p>
                    )}
                    {circuit.input_signals && circuit.input_signals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {circuit.input_signals.map((sig) => (
                          <span key={sig} className="text-xs px-2 py-0.5 rounded bg-dark-700 text-gray-400 border border-gray-700">
                            {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-end">
                    <button
                      onClick={() => navigate(`/prove/${circuit.hash}`, {
                        state: {
                          circuit_hash: circuit.hash,
                          deployed_address: circuit.deployed_address,
                          input_signals: circuit.input_signals,
                          input_descriptions: circuit.input_descriptions,
                          from: '/',
                        },
                      })}
                      disabled={!circuit.deployed_address}
                      className="btn btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Generate Proof
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* CTA Section */}
      <section className="py-20 bg-dark-800/30">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build?</h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Connect your wallet and start generating verifiable proofs in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/templates/upload" className="btn btn-primary">
              Upload a Circuit
            </Link>
            <Link to="/docs" className="btn btn-secondary">
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
