// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IReclaim
 * @notice Interface for Reclaim Protocol verification
 * @dev Used to verify zero-knowledge proofs of institution legitimacy
 */
interface IReclaim {
    struct ClaimInfo {
        string provider;
        string parameters;
        string context;
    }

    struct CompleteClaimData {
        bytes32 identifier;
        address owner;
        uint32 timestampS;
        uint32 epoch;
    }

    struct SignedClaim {
        CompleteClaimData claim;
        bytes[] signatures;
    }

    /**
     * @notice Verify a proof from Reclaim Protocol
     * @param proof The signed claim proof
     * @return bool True if proof is valid
     */
    function verifyProof(SignedClaim memory proof) external view returns (bool);

    /**
     * @notice Extract claim data from proof
     * @param proof The signed claim proof
     * @return ClaimInfo The extracted claim information
     */
    function extractClaimData(SignedClaim memory proof) external pure returns (ClaimInfo memory);
}