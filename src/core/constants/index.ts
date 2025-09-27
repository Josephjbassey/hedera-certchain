/**
 * index.ts - Application Constants
 * 
 * Description: Centralized constants and configuration values used throughout
 * the Hedera CertChain application. Following Betty coding style guidelines.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Constants in UPPER_CASE with underscores
 * - Grouped by functionality
 * - Clear documentation for all constants
 */

/* ========================================================================== */
/*                              APPLICATION INFO                             */
/* ========================================================================== */

export const APP_NAME = 'Hedera CertChain';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Blockchain-based Certificate Verification System';
export const APP_AUTHOR = 'Hedera CertChain Team';

/* ========================================================================== */
/*                              NETWORK CONSTANTS                            */
/* ========================================================================== */

/* Hedera network identifiers */
export const HEDERA_TESTNET_ID = '0x128';
export const HEDERA_MAINNET_ID = '0x127';

/* Network names */
export const TESTNET_NAME = 'testnet';
export const MAINNET_NAME = 'mainnet';

/* Default RPC endpoints */
export const DEFAULT_TESTNET_RPC = 'https://testnet.hashio.io/api';
export const DEFAULT_MAINNET_RPC = 'https://mainnet.hashio.io/api';

/* Mirror node endpoints */
export const DEFAULT_TESTNET_MIRROR = 'https://testnet.mirrornode.hedera.com';
export const DEFAULT_MAINNET_MIRROR = 'https://mainnet.mirrornode.hedera.com';

/* ========================================================================== */
/*                               GAS LIMITS                                  */
/* ========================================================================== */

/* MetaMask gas limits */
export const GAS_LIMIT_TRANSFER_FT = 400000;
export const GAS_LIMIT_TRANSFER_NFT = 500000;
export const GAS_LIMIT_ASSOCIATE_TOKEN = 300000;
export const GAS_LIMIT_CONTRACT_CALL = 600000;
export const GAS_LIMIT_CONTRACT_DEPLOY = 1000000;

/* ========================================================================== */
/*                               FILE LIMITS                                 */
/* ========================================================================== */

/* File size limits in bytes */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; /* 10 MB */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  /* 5 MB */
export const MAX_METADATA_SIZE = 1024 * 1024;   /* 1 MB */

/* Supported file types */
export const SUPPORTED_IMAGE_TYPES = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/webp',
	'image/gif'
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

/* ========================================================================== */
/*                               TIMEOUT VALUES                              */
/* ========================================================================== */

/* Request timeouts in milliseconds */
export const DEFAULT_REQUEST_TIMEOUT = 30000;  /* 30 seconds */
export const WALLET_CONNECT_TIMEOUT = 60000;   /* 60 seconds */
export const IPFS_UPLOAD_TIMEOUT = 120000;     /* 2 minutes */
export const BLOCKCHAIN_TX_TIMEOUT = 180000;   /* 3 minutes */

/* Retry configurations */
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 1000;

/* ========================================================================== */
/*                               WALLET CONSTANTS                            */
/* ========================================================================== */

/* Wallet identifiers */
export const WALLET_METAMASK = 'metamask';
export const WALLET_HASHPACK = 'hashpack';
export const WALLET_BLADE = 'blade';
export const WALLET_KABILA = 'kabila';
export const WALLET_CONNECT = 'walletconnect';

/* Wallet installation URLs */
export const METAMASK_INSTALL_URL = 'https://metamask.io/download/';
export const HASHPACK_INSTALL_URL = 'https://www.hashpack.app/download';
export const BLADE_INSTALL_URL = 'https://bladewallet.io/';
export const KABILA_INSTALL_URL = 'https://kabila.app/';

/* ========================================================================== */
/*                               IPFS CONSTANTS                              */
/* ========================================================================== */

/* IPFS gateway URLs */
export const DEFAULT_IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
export const CLOUDFLARE_IPFS_GATEWAY = 'https://cloudflare-ipfs.com/ipfs/';
export const IPFS_IO_GATEWAY = 'https://ipfs.io/ipfs/';

/* Pinata API endpoints */
export const PINATA_API_BASE = 'https://api.pinata.cloud';
export const PINATA_UPLOAD_ENDPOINT = '/pinning/pinFileToIPFS';
export const PINATA_JSON_ENDPOINT = '/pinning/pinJSONToIPFS';

/* ========================================================================== */
/*                               UI CONSTANTS                                */
/* ========================================================================== */

/* Animation durations in milliseconds */
export const ANIMATION_DURATION_FAST = 150;
export const ANIMATION_DURATION_NORMAL = 300;
export const ANIMATION_DURATION_SLOW = 500;

/* Breakpoint values in pixels */
export const BREAKPOINT_SM = 640;
export const BREAKPOINT_MD = 768;
export const BREAKPOINT_LG = 1024;
export const BREAKPOINT_XL = 1280;

/* ========================================================================== */
/*                               ERROR CODES                                 */
/* ========================================================================== */

/* Wallet error codes */
export const ERROR_WALLET_NOT_FOUND = 'WALLET_NOT_FOUND';
export const ERROR_WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED';
export const ERROR_WALLET_TRANSACTION_FAILED = 'WALLET_TRANSACTION_FAILED';

/* IPFS error codes */
export const ERROR_IPFS_UPLOAD_FAILED = 'IPFS_UPLOAD_FAILED';
export const ERROR_IPFS_FETCH_FAILED = 'IPFS_FETCH_FAILED';
export const ERROR_IPFS_INVALID_HASH = 'IPFS_INVALID_HASH';

/* Validation error codes */
export const ERROR_INVALID_EMAIL = 'INVALID_EMAIL';
export const ERROR_INVALID_FILE_TYPE = 'INVALID_FILE_TYPE';
export const ERROR_FILE_TOO_LARGE = 'FILE_TOO_LARGE';
export const ERROR_REQUIRED_FIELD = 'REQUIRED_FIELD';

/* ========================================================================== */
/*                               REGEX PATTERNS                              */
/* ========================================================================== */

/* Validation patterns */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HEDERA_ACCOUNT_REGEX = /^0\.0\.\d+$/;
export const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const IPFS_HASH_REGEX = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

/* ========================================================================== */
/*                               LOCAL STORAGE KEYS                          */
/* ========================================================================== */

/* Storage keys for persistence */
export const STORAGE_WALLET_TYPE = 'hedera_certchain_wallet_type';
export const STORAGE_WALLET_ADDRESS = 'hedera_certchain_wallet_address';
export const STORAGE_NETWORK_PREFERENCE = 'hedera_certchain_network';
export const STORAGE_THEME_PREFERENCE = 'hedera_certchain_theme';
export const STORAGE_CONTRACT_ADDRESS = 'hedera_certchain_contract';

/* ========================================================================== */
/*                               API ENDPOINTS                               */
/* ========================================================================== */

/* External API endpoints */
export const HEDERA_MIRROR_API_V1 = '/api/v1';
export const CERTIFICATE_LOOKUP_ENDPOINT = '/certificates';
export const TRANSACTION_LOOKUP_ENDPOINT = '/transactions';
export const ACCOUNT_INFO_ENDPOINT = '/accounts';