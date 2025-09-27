// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";

/**
 * @title HederaCertificateNFT
 * @dev Native Hedera Token Service implementation for educational certificates
 * Uses Hedera's built-in NFT functionality for optimal gas efficiency and native features
 */
contract HederaCertificateNFT is HederaTokenService {
    
    // Owner of the contract
    address public owner;
    
    // The Hedera NFT token address (will be set after token creation)
    address public certificateTokenAddress;
    
    // Certificate metadata structure
    struct Certificate {
        string recipientName;
        string recipientEmail; // Hashed for privacy
        string issuerName;
        string courseName;
        string completionDate;
        string ipfsHash;
        uint256 issueTimestamp;
        bool isActive;
        string certificateHash;
    }
    
    // Mapping from serial number to certificate data
    mapping(uint256 => Certificate) public certificates;
    
    // Mapping to track authorized issuers
    mapping(address => bool) public authorizedIssuers;
    
    // Events
    event CertificateIssued(
        address indexed recipient,
        uint256 indexed serialNumber,
        string ipfsHash,
        string certificateHash
    );
    
    event CertificateRevoked(uint256 indexed serialNumber, string reason);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner, "Not authorized to issue certificates");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Creates the Hedera NFT token for certificates
     * This must be called after deployment to initialize the token
     */
    function createCertificateToken(
        string memory name,
        string memory symbol,
        string memory memo
    ) external onlyOwner returns (address tokenAddress) {
        require(certificateTokenAddress == address(0), "Token already created");
        
        // Create token structure
        IHederaTokenService.HederaToken memory token;
        token.name = name;
        token.symbol = symbol;
        token.memo = memo;
        token.treasury = address(this);
        token.tokenSupplyType = false; // FINITE supply
        token.maxSupply = 1000000; // Maximum 1 million certificates
        token.freezeDefault = false;
        token.tokenKeys = new IHederaTokenService.TokenKey[](1);
        
        // Set supply key (needed for minting NFTs)
        token.tokenKeys[0] = IHederaTokenService.TokenKey({
            keyType: 2, // SUPPLY_KEY
            key: IHederaTokenService.KeyValue({
                inheritAccountKey: false,
                contractId: address(this),
                ed25519: new bytes(0),
                ECDSA_secp256k1: new bytes(0),
                delegatableContractId: address(0)
            })
        });
        
        // Create the NFT token
        (int responseCode, address createdTokenAddress) = HederaTokenService.createNonFungibleToken(token);
        
        require(responseCode == HederaResponseCodes.SUCCESS, "Token creation failed");
        
        certificateTokenAddress = createdTokenAddress;
        return createdTokenAddress;
    }
    
    /**
     * @dev Issues a new certificate NFT
     */
    function issueCertificate(
        address recipient,
        string memory recipientName,
        string memory recipientEmail,
        string memory issuerName,
        string memory courseName,
        string memory completionDate,
        string memory ipfsHash,
        string memory certificateHash
    ) external onlyAuthorizedIssuer returns (uint256 serialNumber) {
        require(certificateTokenAddress != address(0), "Certificate token not created");
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(certificateHash).length > 0, "Certificate hash required");
        
        // Create metadata for the NFT
        bytes[] memory metadata = new bytes[](1);
        metadata[0] = abi.encode(ipfsHash, certificateHash);
        
        // Mint the NFT
        (int responseCode, , uint64[] memory serialNumbers) = HederaTokenService.mintToken(
            certificateTokenAddress,
            0, // amount (not used for NFTs)
            metadata
        );
        
        require(responseCode == HederaResponseCodes.SUCCESS, "Minting failed");
        require(serialNumbers.length > 0, "No serial number returned");
        
        serialNumber = uint256(serialNumbers[0]);
        
        // Store certificate data
        certificates[serialNumber] = Certificate({
            recipientName: recipientName,
            recipientEmail: recipientEmail,
            issuerName: issuerName,
            courseName: courseName,
            completionDate: completionDate,
            ipfsHash: ipfsHash,
            issueTimestamp: block.timestamp,
            isActive: true,
            certificateHash: certificateHash
        });
        
        // Transfer NFT to recipient
        int transferResponse = HederaTokenService.transferNFT(
            certificateTokenAddress,
            address(this),
            recipient,
            int64(int256(serialNumber))
        );
        
        require(transferResponse == HederaResponseCodes.SUCCESS, "Transfer failed");
        
        emit CertificateIssued(recipient, serialNumber, ipfsHash, certificateHash);
        
        return serialNumber;
    }
    
    /**
     * @dev Verifies a certificate by serial number
     */
    function verifyCertificate(uint256 serialNumber) 
        external 
        view 
        returns (
            Certificate memory certificate, 
            address currentOwner, 
            bool isValid
        ) 
    {
        certificate = certificates[serialNumber];
        
        // Check if certificate exists and is active
        isValid = certificate.isActive && certificate.issueTimestamp > 0;
        
        if (isValid) {
            // Get current owner from Hedera Token Service
            currentOwner = getNFTOwner(certificateTokenAddress, serialNumber);
        }
        
        return (certificate, currentOwner, isValid);
    }
    
    /**
     * @dev Verifies a certificate by certificate hash
     */
    function verifyCertificateByHash(string memory certificateHash) 
        external 
        view 
        returns (
            Certificate memory certificate,
            address currentOwner,
            bool isValid,
            uint256 serialNumber
        ) 
    {
        // Note: In a production system, you'd want to optimize this with a mapping
        // For now, we'll return empty data as this requires iterating through all certificates
        // This can be implemented with events and off-chain indexing
        
        return (certificate, address(0), false, 0);
    }
    
    /**
     * @dev Revokes a certificate (marks as inactive)
     */
    function revokeCertificate(uint256 serialNumber, string memory reason) 
        external 
        onlyAuthorizedIssuer 
    {
        require(certificates[serialNumber].issueTimestamp > 0, "Certificate does not exist");
        require(certificates[serialNumber].isActive, "Certificate already revoked");
        
        certificates[serialNumber].isActive = false;
        
        emit CertificateRevoked(serialNumber, reason);
    }
    
    /**
     * @dev Authorizes an address to issue certificates
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }
    
    /**
     * @dev Revokes issuer authorization
     */
    function revokeIssuer(address issuer) external onlyOwner {
        require(issuer != owner, "Cannot revoke owner");
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }
    
    /**
     * @dev Helper function to get NFT owner (simplified)
     * In practice, you'd call getNonFungibleTokenInfo from HederaTokenService
     */
    function getNFTOwner(address tokenAddress, uint256 serialNumber) 
        internal 
        pure 
        returns (address) 
    {
        // Placeholder - in real implementation, call HederaTokenService.getNonFungibleTokenInfo
        // For now, return zero address to indicate we need to implement this
        return address(0);
    }
    
    /**
     * @dev Get total number of certificates issued
     */
    function getTotalCertificates() external view returns (uint256) {
        // This would need to be tracked via a counter in a production system
        return 0;
    }
    
    /**
     * @dev Check if an address is an authorized issuer
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return authorizedIssuers[issuer];
    }
}