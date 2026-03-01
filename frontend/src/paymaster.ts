import type { PaymasterDetails } from 'starknet';
import { paymasterRpcProvider } from '@starknet-react/core';
import type { ChainPaymasterFactory } from '@starknet-react/core';

const API_BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : 'http://localhost:8000/api/v1';

/**
 * Factory for StarknetConfig — creates a PaymasterRpc per chain,
 * pointing at our backend proxy that injects the Avnu API key.
 */
export const paymasterFactory: ChainPaymasterFactory = paymasterRpcProvider({
  rpc: (_chain) => ({
    nodeUrl: `${API_BASE_URL}/paymaster`,
  }),
});


export const PAYMASTER_DETAILS: PaymasterDetails = {
  feeMode: { mode: 'sponsored' },
};
