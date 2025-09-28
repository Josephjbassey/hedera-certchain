// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VerifiableCertificateNFT
 * @dev ERC-721 compatible soulbound NFT for verifiable certificates on Hedera Hashgraph
 * 
 * Features:
 * - Non-transferable certificates (soulbound tokens)
 * - IPFS metadata storage with CID references
 * - Role-based access control for issuers
 * - Certificate verification with hash validation
 * - Batch minting capabilities
 * - Revocation mechanism with on-chain tracking
 * - Expiry date support for time-limited certificates
 * - Institution management system
 */
contract VerifiableCertificateNFT is ERC721, ERC721URIStorage, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Token ID counter
    Counters.Counter private _tokenIdCounter;

    // Certificate structure
    struct Certificate {
        address issuer;
        address recipient;
        bytes32 certificateHash;
        uint256 timestamp;
        uint256 expiryTimestamp;
        string ipfsCID;
        bool isRevoked;
        string institutionName;
    }

    // Institution structure
    struct Institution {
        string name;
        address admin;
        bool isActive;
        uint256 certificatesIssued;
    }

    // Mappings
    mapping(uint256 => Certificate) public certificates;
    mapping(bytes32 => uint256) public hashToTokenId;
    mapping(address => Institution) public institutions;
    mapping(address => uint256[]) public recipientCertificates;
    mapping(address => uint256[]) public issuerCertificates;

    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        bytes32 certificateHash,
        string ipfsCID
    );

    event CertificateRevoked(
        uint256 indexed tokenId,
        address indexed issuer,
        uint256 timestamp
    );

    event IssuerAdded(
        address indexed issuer,
        string institutionName,
        address indexed admin
    );

    event IssuerRemoved(
        address indexed issuer,
        address indexed admin
    );

    event BatchMintCompleted(
        address indexed issuer,
        uint256 count,
        uint256[] tokenIds
    );

    /**
     * @dev Constructor initializes the contract with default admin role
     * @param name Token name
     * @param symbol Token symbol
     */
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Mint a new certificate NFT
     * @param recipient Address to receive the certificate
     * @param ipfsCID IPFS content identifier for certificate metadata
     * @param certificateHash Hash of the original certificate file
     * @param expiryTimestamp Expiry timestamp (0 for no expiry)
     * @return tokenId The ID of the minted token
     */
    function mintCertificate(
        address recipient,
        string memory ipfsCID,
        bytes32 certificateHash,
        uint256 expiryTimestamp
    ) external onlyRole(ISSUER_ROLE) nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(certificateHash != bytes32(0), "Certificate hash cannot be empty");
        require(
            expiryTimestamp == 0 || expiryTimestamp > block.timestamp,
            "Invalid expiry timestamp"
        );
        require(hashToTokenId[certificateHash] == 0, "Certificate hash already exists");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Create certificate record
        certificates[tokenId] = Certificate({
            issuer: msg.sender,
            recipient: recipient,
            certificateHash: certificateHash,
            timestamp: block.timestamp,
            expiryTimestamp: expiryTimestamp,
            ipfsCID: ipfsCID,
            isRevoked: false,
            institutionName: institutions[msg.sender].name
        });

        // Update mappings
        hashToTokenId[certificateHash] = tokenId;
        recipientCertificates[recipient].push(tokenId);
        issuerCertificates[msg.sender].push(tokenId);

        // Update institution stats
        institutions[msg.sender].certificatesIssued++;

        // Mint the token
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsCID)));

        emit CertificateMinted(tokenId, recipient, msg.sender, certificateHash, ipfsCID);

        return tokenId;
    }

    /**
     * @dev Verify a certificate by token ID
     * @param tokenId The ID of the certificate to verify
     * @return isValid Whether the certificate is valid
     * @return issuer Address of the certificate issuer
     * @return timestamp When the certificate was issued
     * @return ipfsCID IPFS content identifier
     * @return isRevoked Whether the certificate has been revoked
     * @return isExpired Whether the certificate has expired
     */
    function verifyCertificate(uint256 tokenId)
        external
        view
        returns (
            bool isValid,
            address issuer,
            uint256 timestamp,
            string memory ipfsCID,
            bool isRevoked,
            bool isExpired
        )
    {
        require(_exists(tokenId), "Certificate does not exist");

        Certificate memory cert = certificates[tokenId];
        bool expired = cert.expiryTimestamp != 0 && block.timestamp > cert.expiryTimestamp;

        return (
            !cert.isRevoked && !expired,
            cert.issuer,
            cert.timestamp,
            cert.ipfsCID,
            cert.isRevoked,
            expired
        );
    }

    /**
     * @dev Revoke a certificate
     * @param tokenId The ID of the certificate to revoke
     */
    function revokeCertificate(uint256 tokenId) external {
        require(_exists(tokenId), "Certificate does not exist");
        Certificate storage cert = certificates[tokenId];
        require(
            cert.issuer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to revoke this certificate"
        );
        require(!cert.isRevoked, "Certificate already revoked");

        cert.isRevoked = true;

        emit CertificateRevoked(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @dev Add a new issuer (institution)
     * @param issuer Address of the new issuer
     * @param institutionName Name of the institution
     */
    function addIssuer(address issuer, string memory institutionName)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(issuer != address(0), "Invalid issuer address");
        require(bytes(institutionName).length > 0, "Institution name cannot be empty");
        require(!hasRole(ISSUER_ROLE, issuer), "Address is already an issuer");

        _grantRole(ISSUER_ROLE, issuer);

        institutions[issuer] = Institution({
            name: institutionName,
            admin: msg.sender,
            isActive: true,
            certificatesIssued: 0
        });

        emit IssuerAdded(issuer, institutionName, msg.sender);
    }

    /**
     * @dev Remove an issuer
     * @param issuer Address of the issuer to remove
     */
    function removeIssuer(address issuer) external onlyRole(ADMIN_ROLE) {
        require(hasRole(ISSUER_ROLE, issuer), "Address is not an issuer");

        _revokeRole(ISSUER_ROLE, issuer);
        institutions[issuer].isActive = false;

        emit IssuerRemoved(issuer, msg.sender);
    }

    /**
     * @dev Get certificate by hash
     * @param hash The certificate hash to look up
     * @return tokenId The token ID associated with the hash
     * @return exists Whether a certificate with this hash exists
     */
    function getCertificateByHash(bytes32 hash)
        external
        view
        returns (uint256 tokenId, bool exists)
    {
        tokenId = hashToTokenId[hash];
        exists = tokenId != 0 || (tokenId == 0 && _exists(0) && certificates[0].certificateHash == hash);
    }

    /**
     * @dev Batch mint certificates
     * @param recipients Array of recipient addresses
     * @param ipfsCIDs Array of IPFS CIDs
     * @param hashes Array of certificate hashes
     * @param expiryTimestamps Array of expiry timestamps
     * @return tokenIds Array of minted token IDs
     */
    function batchMintCertificates(
        address[] memory recipients,
        string[] memory ipfsCIDs,
        bytes32[] memory hashes,
        uint256[] memory expiryTimestamps
    ) external onlyRole(ISSUER_ROLE) nonReentrant returns (uint256[] memory) {
        require(
            recipients.length == ipfsCIDs.length &&
            recipients.length == hashes.length &&
            recipients.length == expiryTimestamps.length,
            "Array lengths must match"
        );
        require(recipients.length > 0, "No recipients provided");
        require(recipients.length <= 100, "Batch size too large");

        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = mintCertificate(
                recipients[i],
                ipfsCIDs[i],
                hashes[i],
                expiryTimestamps[i]
            );
        }

        emit BatchMintCompleted(msg.sender, recipients.length, tokenIds);

        return tokenIds;
    }

    /**
     * @dev Get certificates owned by an address
     * @param owner Address to query
     * @return tokenIds Array of token IDs owned by the address
     */
    function getCertificatesByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return recipientCertificates[owner];
    }

    /**
     * @dev Get certificates issued by an address
     * @param issuer Address to query
     * @return tokenIds Array of token IDs issued by the address
     */
    function getCertificatesByIssuer(address issuer)
        external
        view
        returns (uint256[] memory)
    {
        return issuerCertificates[issuer];
    }

    /**
     * @dev Get institution information
     * @param issuer Address of the issuer
     * @return name Institution name
     * @return admin Admin address
     * @return isActive Whether the institution is active
     * @return certificatesIssued Number of certificates issued
     */
    function getInstitution(address issuer)
        external
        view
        returns (
            string memory name,
            address admin,
            bool isActive,
            uint256 certificatesIssued
        )
    {
        Institution memory institution = institutions[issuer];
        return (
            institution.name,
            institution.admin,
            institution.isActive,
            institution.certificatesIssued
        );
    }

    /**
     * @dev Override _beforeTokenTransfer to make tokens soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(
            from == address(0) || to == address(0),
            "Certificate NFTs are soulbound and cannot be transferred"
        );
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Override _burn to handle URI storage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Override tokenURI for URI storage
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override supportsInterface for AccessControl
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get total number of certificates issued
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
}
