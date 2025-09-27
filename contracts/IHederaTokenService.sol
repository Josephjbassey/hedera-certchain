// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

interface IHederaTokenService {

    struct HederaToken {
        string name;
        string symbol;
        address treasury;
        string memo;
        bool tokenSupplyType;
        int64 maxSupply;
        bool freezeDefault;
        TokenKey[] tokenKeys;
        Expiry expiry;
    }

    struct TokenKey {
        uint keyType;
        KeyValue key;
    }

    struct KeyValue {
        bool inheritAccountKey;
        address contractId;
        bytes ed25519;
        bytes ECDSA_secp256k1;
        address delegatableContractId;
    }

    struct Expiry {
        int64 second;
        address autoRenewAccount;
        int64 autoRenewPeriod;
    }

    struct NonFungibleTokenInfo {
        int64 serialNumber;
        address accountID;
        int64 creationTime;
        bytes metadata;
        address spenderID;
    }

    function createFungibleToken(
        HederaToken memory token,
        int64 initialTotalSupply,
        int32 decimals
    ) external returns (int responseCode, address tokenAddress);

    function createNonFungibleToken(HederaToken memory token) 
        external returns (int responseCode, address tokenAddress);

    function mintToken(address token, int64 amount, bytes[] memory metadata)
        external returns (int responseCode, int64 newTotalSupply, int64[] memory serialNumbers);

    function transferNFT(address token, address sender, address receiver, int64 serialNumber)
        external returns (int responseCode);

    function getNonFungibleTokenInfo(address token, int64 serialNumber)
        external returns (int responseCode, NonFungibleTokenInfo memory tokenInfo);

    function isToken(address token) external returns (int responseCode, bool tokenFlag);
}