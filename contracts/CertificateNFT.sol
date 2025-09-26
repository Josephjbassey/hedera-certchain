// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CertificateNFT
 * @dev NFT contract for educational certificates on Hedera
 * Each certificate is a unique NFT with immutable metadata stored on IPFS
 */
contract CertificateNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Certificate structure
    struct Certificate {
        string recipientName;
        string recipientEmail; // Hashed for privacy
        string issuerName;
        string courseName;
        string completionDate;
        string ipfsHash;
        uint256 issueTimestamp;
        bool isActive;
        string certificateHash; // SHA-256 of original certificate file
    }
    
    // Mappings
    mapping(uint256 => Certificate) public certificates;
    mapping(address => bool) public authorizedIssuers;
    mapping(string => bool) public usedHashes; // Prevent duplicate certificates
    mapping(address => uint256[]) public recipientCertificates;
    mapping(string => uint256) public hashToTokenId;
    
    // Events
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        string courseName,
        string ipfsHash
    );
    
    event CertificateRevoked(uint256 indexed tokenId, string reason);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    
    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner(), "Not authorized to issue certificates");
        _;
    }
    
    modifier certificateExists(uint256 tokenId) {
        require(_exists(tokenId), "Certificate does not exist");
        _;
    }
    
    constructor() ERC721("Hedera Certificate", "HCERT") {
        // Contract deployer is automatically an authorized issuer
        authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Issue a new certificate NFT
     * @param recipient The address that will receive the certificate NFT
     * @param recipientName The name of the certificate recipient
     * @param recipientEmailHash Hashed email for privacy
     * @param issuerName Name of the issuing organization
     * @param courseName Name of the course/certification
     * @param completionDate Date of course completion
     * @param ipfsHash IPFS hash of the certificate metadata
     * @param certificateHash SHA-256 hash of the original certificate file
     */
    function issueCertificate(
        address recipient,
        string memory recipientName,
        string memory recipientEmailHash,
        string memory issuerName,
        string memory courseName,
        string memory completionDate,
        string memory ipfsHash,
        string memory certificateHash
    ) external onlyAuthorizedIssuer nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(recipientName).length > 0, "Recipient name required");
        require(bytes(courseName).length > 0, "Course name required");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(certificateHash).length > 0, "Certificate hash required");
        require(!usedHashes[certificateHash], "Certificate already exists");
        
        // Increment token ID
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        // Create certificate metadata
        Certificate memory newCertificate = Certificate({
            recipientName: recipientName,
            recipientEmail: recipientEmailHash,
            issuerName: issuerName,
            courseName: courseName,
            completionDate: completionDate,
            ipfsHash: ipfsHash,
            issueTimestamp: block.timestamp,
            isActive: true,
            certificateHash: certificateHash
        });
        
        // Store certificate data
        certificates[tokenId] = newCertificate;
        usedHashes[certificateHash] = true;
        recipientCertificates[recipient].push(tokenId);
        hashToTokenId[certificateHash] = tokenId;
        
        // Mint NFT to recipient
        _safeMint(recipient, tokenId);
        
        // Set token URI to IPFS hash
        string memory tokenURI = string(abi.encodePacked("ipfs://", ipfsHash));
        _setTokenURI(tokenId, tokenURI);
        
        emit CertificateIssued(tokenId, recipient, msg.sender, courseName, ipfsHash);
        
        return tokenId;
    }
    
    /**
     * @dev Verify a certificate by token ID
     * @param tokenId The ID of the certificate NFT
     * @return Certificate data and verification status
     */
    function verifyCertificate(uint256 tokenId) external view certificateExists(tokenId) returns (
        Certificate memory certificate,
        address owner,
        bool isValid
    ) {
        certificate = certificates[tokenId];
        owner = ownerOf(tokenId);
        isValid = certificate.isActive;
        
        return (certificate, owner, isValid);
    }
    
    /**
     * @dev Verify certificate by original file hash
     * @param certificateHash SHA-256 hash of the original certificate
     * @return Certificate data and verification status
     */
    function verifyCertificateByHash(string memory certificateHash) external view returns (
        Certificate memory certificate,
        address owner,
        bool isValid,
        uint256 tokenId
    ) {
        require(usedHashes[certificateHash], "Certificate not found");
        
        tokenId = hashToTokenId[certificateHash];
        certificate = certificates[tokenId];
        owner = ownerOf(tokenId);
        isValid = certificate.isActive;
        
        return (certificate, owner, isValid, tokenId);
    }
    
    /**
     * @dev Revoke a certificate (mark as inactive)
     * @param tokenId The ID of the certificate to revoke
     * @param reason Reason for revocation
     */
    function revokeCertificate(uint256 tokenId, string memory reason) 
        external 
        onlyAuthorizedIssuer 
        certificateExists(tokenId) 
    {
        require(certificates[tokenId].isActive, "Certificate already revoked");
        
        certificates[tokenId].isActive = false;
        
        emit CertificateRevoked(tokenId, reason);
    }
    
    /**
     * @dev Get all certificates owned by an address
     * @param owner The address to query
     * @return Array of token IDs owned by the address
     */
    function getCertificatesByOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Get certificates issued to a specific recipient (by address)
     * @param recipient The recipient address
     * @return Array of token IDs
     */
    function getCertificatesByRecipient(address recipient) external view returns (uint256[] memory) {
        return recipientCertificates[recipient];
    }
    
    /**
     * @dev Add an authorized certificate issuer
     * @param issuer The address to authorize
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }
    
    /**
     * @dev Remove authorization from a certificate issuer
     * @param issuer The address to revoke authorization from
     */
    function revokeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }
    
    /**
     * @dev Check if an address is an authorized issuer
     * @param issuer The address to check
     * @return True if authorized, false otherwise
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return authorizedIssuers[issuer] || issuer == owner();
    }
    
    /**
     * @dev Get total number of certificates issued
     * @return Total supply of certificate NFTs
     */
    function getTotalCertificates() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Batch issue certificates (gas efficient for multiple certificates)
     * @param recipients Array of recipient addresses
     * @param certificateData Array of certificate data
     * @param ipfsHashes Array of IPFS hashes
     * @param certificateHashes Array of certificate file hashes
     */
    function batchIssueCertificates(
        address[] memory recipients,
        string[][] memory certificateData, // [recipientName, recipientEmailHash, issuerName, courseName, completionDate]
        string[] memory ipfsHashes,
        string[] memory certificateHashes
    ) external onlyAuthorizedIssuer nonReentrant returns (uint256[] memory) {
        require(recipients.length == certificateData.length, "Array length mismatch");
        require(recipients.length == ipfsHashes.length, "Array length mismatch");
        require(recipients.length == certificateHashes.length, "Array length mismatch");
        
        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = issueCertificate(
                recipients[i],
                certificateData[i][0], // recipientName
                certificateData[i][1], // recipientEmailHash
                certificateData[i][2], // issuerName
                certificateData[i][3], // courseName
                certificateData[i][4], // completionDate
                ipfsHashes[i],
                certificateHashes[i]
            );
        }
        
        return tokenIds;
    }
    
    // Required overrides for multiple inheritance
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}