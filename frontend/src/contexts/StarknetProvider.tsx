import React from 'react';
import { sepolia } from '@starknet-react/chains';
import {
  StarknetConfig,
  jsonRpcProvider,
  ready,
  braavos,
  useInjectedConnectors,
  voyager,
} from "@starknet-react/core";
import { paymasterFactory } from '../paymaster';

export const StarknetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const chains = [sepolia];

  const provider = jsonRpcProvider({
  rpc: (_chain) => {
    return { nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/tPHqpWiSDDnnkqtpd3QEy" };
  },
});
  
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [ready(), braavos()],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: "always",
    // Randomize the order of the connectors.
    order: "random",
  });

  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      paymasterProvider={paymasterFactory}
      connectors={connectors}
      autoConnect
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
};