/**
 * app.config.ts - Main Application Configuration
 * 
 * Description: Centralized configuration management for the Hedera CertChain 
 * application. Contains network settings, API endpoints, and application constants
 * following the Betty coding style guidelines.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Function names in snake_case
 * - Constants in UPPER_CASE
 * - Interfaces in PascalCase
 * - Comprehensive documentation for all exports
 */

/* Network Configuration Interface */
export interface NetworkConfig {
	network: string;
	chain_id: string;
	json_rpc_url: string;
	mirror_node_url: string;
}

/* Application Configuration Interface */
export interface AppConfig {
	networks: {
		testnet: NetworkConfig;
		mainnet: NetworkConfig;
	};
	constants: {
		METAMASK_GAS_LIMIT_TRANSFER_FT: number;
		METAMASK_GAS_LIMIT_TRANSFER_NFT: number;
		METAMASK_GAS_LIMIT_ASSOCIATE: number;
		DEFAULT_REQUEST_TIMEOUT: number;
		MAX_FILE_SIZE_MB: number;
		SUPPORTED_IMAGE_TYPES: string[];
	};
}

/* Main Application Configuration Object */
export const app_config: AppConfig = {
	networks: {
		testnet: {
			network: 'testnet',
			chain_id: '0x128', /* Hedera testnet chain ID (296 in decimal) */
			json_rpc_url: 'https://testnet.hashio.io/api',
			mirror_node_url: 'https://testnet.mirrornode.hedera.com',
		},
		mainnet: {
			network: 'mainnet',
			chain_id: '0x127', /* Hedera mainnet chain ID (295 in decimal) */
			json_rpc_url: 'https://mainnet.hashio.io/api',
			mirror_node_url: 'https://mainnet.mirrornode.hedera.com',
		},
	},
	constants: {
		/* Gas limits for MetaMask transactions */
		METAMASK_GAS_LIMIT_TRANSFER_FT: 400000,
		METAMASK_GAS_LIMIT_TRANSFER_NFT: 500000,
		METAMASK_GAS_LIMIT_ASSOCIATE: 300000,
		
		/* Application limits and settings */
		DEFAULT_REQUEST_TIMEOUT: 30000, /* 30 seconds */
		MAX_FILE_SIZE_MB: 10,
		SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
	},
};

/**
 * get_current_network_config - Retrieve current network configuration
 * 
 * Description: Returns the network configuration based on the environment
 * or defaults to testnet for development.
 * 
 * Return: NetworkConfig object for the current environment
 */
export function get_current_network_config(): NetworkConfig {
	const is_production = process.env.NODE_ENV === 'production';
	return is_production ? app_config.networks.mainnet : app_config.networks.testnet;
}

/**
 * validate_network_config - Validate network configuration
 * 
 * @config: NetworkConfig object to validate
 * 
 * Description: Validates that all required network configuration
 * properties are present and properly formatted.
 * 
 * Return: boolean indicating if config is valid
 */
export function validate_network_config(config: NetworkConfig): boolean {
	if (!config.network || !config.chain_id || !config.json_rpc_url || !config.mirror_node_url) {
		return false;
	}
	
	/* Validate chain ID format */
	if (!config.chain_id.startsWith('0x')) {
		return false;
	}
	
	/* Validate URLs */
	try {
		new URL(config.json_rpc_url);
		new URL(config.mirror_node_url);
	} catch {
		return false;
	}
	
	return true;
}

/* Export types for external use */
export type { NetworkConfig, AppConfig };