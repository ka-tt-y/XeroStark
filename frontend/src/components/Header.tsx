import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import Toast, { ToastType } from './Toast';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { address } = useAccount();
  const { connectAsync, connectors, isPending, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info',
  });
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowWalletModal(false);
      }
    };
    if (showWalletModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWalletModal]);

  const showToast = (message: string, type: ToastType = 'error') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const getInstallUrl = (connectorId: string) => {
    return connectorId === 'braavos' ? 'https://braavos.app/' : 'https://www.ready.co/';
  };

  const formatConnectError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Wallet connection failed.';
    const normalized = message.toLowerCase();

    if (normalized.includes('reject')) {
      return 'Connection request was rejected in your wallet.';
    }

    if (normalized.includes('chain') || normalized.includes('switch')) {
      return 'Please switch your wallet to Starknet Sepolia and try again.';
    }

    return message;
  };

  const connectWithConnector = async (connector: (typeof connectors)[number]) => {
    setShowWalletModal(false);
    try {
      await connectAsync({ connector });
    } catch (error) {
      showToast(formatConnectError(error), 'error');
    }
  };

  const handleConnect = async () => {
    if (isPending) {
      return;
    }

    // Filter to only available (installed) connectors
    const available = connectors.filter((c) => c.available());
    if (available.length === 1) {
      // Only one wallet installed — connect directly
      await connectWithConnector(available[0]);
    } else if (available.length > 1) {
      // Multiple wallets — show picker
      setShowWalletModal(true);
    } else {
      // No wallets — show picker anyway so user sees recommended install links
      setShowWalletModal(true);
    }
  };

  const handleSelectConnector = async (connector: (typeof connectors)[number]) => {
    await connectWithConnector(connector);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
   <header className="sticky top-0 z-50 backdrop-blur-lg bg-dark-900/80 border-b border-gray-800 light:bg-white/80 light:border-gray-200">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-25 h-15 rounded-lg flex items-center justify-center">
              <img src="logo.png" alt="xerostark logo" className="w-25 h-15" />
            </div>
            <span className="text-xl font-bold text-white">xerostark</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/templates" className="text-gray-300 hover:text-white transition-colors">
              Templates
            </Link>
            <Link to="/circuits" className="text-gray-300 hover:text-white transition-colors">
              Deployed Circuits
            </Link>
            {address && (
              <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
            )}
            <Link to="/docs" className="text-gray-300 hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          {/* Actions */}
<div className="flex items-center space-x-3">
  {/* Theme Toggle — desktop only */}
  <button
    onClick={toggleTheme}
    className="hidden md:block p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? (
      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )}
  </button>

  {/* Connect Wallet Button — desktop only */}
  <div className="hidden md:block">
  {address ? (
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 bg-dark-700 rounded-lg text-sm text-gray-300">
                  {formatAddress(address)}
                </div>
                <button 
                  onClick={() => disconnect()}
                  className="btn btn-secondary"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => void handleConnect()}
                disabled={isPending}
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
  </div>

  {/* Mobile Hamburger */}
  <button
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    className="md:hidden p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
    aria-label="Toggle menu"
  >
    {mobileMenuOpen ? (
      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )}
  </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-dark-900/95 backdrop-blur-lg light:text-white">
          <div className="container-custom py-3 flex flex-col space-y-1">
            <Link to="/templates" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-dark-700 transition-colors">
              Templates
            </Link>
            <Link to="/circuits" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-dark-700 transition-colors">
              Deployed Circuits
            </Link>
            {address && (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-dark-700 transition-colors">
                Dashboard
              </Link>
            )}
            <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-dark-700 transition-colors">
              Docs
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-800 my-1"></div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-dark-700 transition-colors w-full text-left"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* Wallet */}
            {address ? (
              <div className="px-3 py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-mono">{formatAddress(address)}</span>
                  <button
                    onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { void handleConnect(); setMobileMenuOpen(false); }}
                disabled={isPending}
                className="mx-3 mt-1 btn btn-primary w-[calc(100%-1.5rem)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div ref={modalRef} className="bg-dark-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
              <button onClick={() => setShowWalletModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-2">
              {connectors.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No wallets detected. Please install a Starknet wallet extension.
                </p>
              ) : (
                connectors.map((connector) => {
                  const isAvailable = connector.available();
                  const isConnectorPending = isPending && pendingConnector?.id === connector.id;
                  return (
                    <button
                      key={connector.id}
                      onClick={() => {
                        if (isPending) return;
                        if (isAvailable) {
                          void handleSelectConnector(connector);
                          return;
                        }
                        window.open(getInstallUrl(connector.id), '_blank');
                      }}
                      disabled={isPending}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isAvailable
                          ? 'bg-dark-700 hover:bg-dark-600 cursor-pointer'
                          : 'bg-dark-900/50 opacity-60 cursor-pointer'
                      } ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {connector.icon && (
                        <img
                          src={typeof connector.icon === 'string' ? connector.icon : connector.icon.dark}
                          alt={connector.name}
                          className="w-8 h-8 rounded-lg"
                        />
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-white">{connector.name}</p>
                        <p className="text-xs text-gray-500">
                          {isConnectorPending ? 'Waiting for wallet approval...' : isAvailable ? 'Click to connect' : 'Not installed — click to install'}
                        </p>
                      </div>
                      {isAvailable && (
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                New to Starknet?{' '}
                <a href="https://www.starknet.io/wallets/" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark">
                  Get a wallet
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </header>
  );
};

export default Header;
