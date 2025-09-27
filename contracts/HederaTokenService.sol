// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "./IHederaTokenService.sol";
import "./HederaResponseCodes.sol";

abstract contract HederaTokenService {
    address constant precompileAddress = address(0x167);

    modifier nonEmptyExpiry(IHederaTokenService.Expiry memory expiry) {
        require(expiry.second != 0 || expiry.autoRenewAccount != address(0), "Expiry cannot be empty");
        _;
    }

    function createFungibleToken(
        IHederaTokenService.HederaToken memory token,
        int64 initialTotalSupply,
        int32 decimals
    ) internal returns (int responseCode, address tokenAddress) {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.createFungibleToken.selector,
                token, initialTotalSupply, decimals));
        (responseCode, tokenAddress) = success ? abi.decode(result, (int, address)) : (HederaResponseCodes.UNKNOWN, address(0));
    }

    function createNonFungibleToken(IHederaTokenService.HederaToken memory token)
    internal returns (int responseCode, address tokenAddress)
    {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.createNonFungibleToken.selector, token));
        (responseCode, tokenAddress) = success ? abi.decode(result, (int, address)) : (HederaResponseCodes.UNKNOWN, address(0));
    }

    function mintToken(address token, int64 amount, bytes[] memory metadata)
    internal returns (int responseCode, int64 newTotalSupply, int64[] memory serialNumbers)
    {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.mintToken.selector, token, amount, metadata));
        (responseCode, newTotalSupply, serialNumbers) = success ? abi.decode(result, (int, int64, int64[])) : (HederaResponseCodes.UNKNOWN, 0, new int64[](0));
    }

    function transferNFT(address token, address sender, address receiver, int64 serialNumber)
    internal returns (int responseCode)
    {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferNFT.selector, token, sender, receiver, serialNumber));
        responseCode = success ? abi.decode(result, (int)) : HederaResponseCodes.UNKNOWN;
    }

    function getNonFungibleTokenInfo(address token, int64 serialNumber)
    internal returns (int responseCode, IHederaTokenService.NonFungibleTokenInfo memory tokenInfo)
    {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getNonFungibleTokenInfo.selector, token, serialNumber));
        (responseCode, tokenInfo) = success ? abi.decode(result, (int, IHederaTokenService.NonFungibleTokenInfo)) : (HederaResponseCodes.UNKNOWN, IHederaTokenService.NonFungibleTokenInfo(0, address(0), 0, new bytes(0), address(0)));
    }

    function isToken(address token) internal returns (int responseCode, bool tokenFlag) {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isToken.selector, token));
        (responseCode, tokenFlag) = success ? abi.decode(result, (int, bool)) : (HederaResponseCodes.UNKNOWN, false);
    }
}