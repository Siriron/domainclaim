/// <reference types="vite/client" />

// DomainClaim — chain configuration
//
// StudioNet only, by explicit project convention: every current app in
// this project targets StudioNet exclusively. No Bradbury wiring, no
// network toggle — a toggle with only one real network behind it is
// worse than no toggle at all.

export const STUDIONET_CONTRACT_ADDRESS =
  '0x03E5E595834cAF1c50Eb88229eA1e6520B344b88';

export const STUDIONET_CONFIG = {
  chainId: '0xF22F', // 61999
  chainName: 'GenLayer StudioNet',
  rpcUrls: ['https://studio.genlayer.com/api'],
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
};

export const EXPLORER_TX_URL = (hash: string) =>
  `${STUDIONET_CONFIG.blockExplorerUrls[0]}/tx/${hash}`;

export const EXPLORER_ADDRESS_URL = (address: string) =>
  `${STUDIONET_CONFIG.blockExplorerUrls[0]}/address/${address}`;

export const RECEIPT_CONFIG = {
  retries: 120,
  interval: 4000,
};

// Same window a resolved claim stays challengeable on-chain
// (_CHALLENGE_WINDOW_SECONDS in the contract). Kept in sync here for
// display purposes only — the contract's own assert is the real guard.
export const CHALLENGE_WINDOW_SECONDS = 7 * 86400;
