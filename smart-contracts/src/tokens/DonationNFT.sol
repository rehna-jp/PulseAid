// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../libraries/Errors.sol";

/**
 * @title DonationNFT
 * @notice ERC-721 collectible receipt minted to donors after campaign funds are released.
 *         Each token is a permanent, on-chain proof of impact — shareable, verifiable forever.
 * @dev    Metadata stored on IPFS; token URI set at mint time by the minter role.
 *         One NFT per donation event (a donor can hold many if they donate to multiple campaigns).
 */
contract DonationNFT is ERC721URIStorage, AccessControl, ReentrancyGuard {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ── Receipt Data ─────────────────────────────────────────────────────────

    struct DonationReceipt {
        uint256 campaignId;      // Which campaign
        address donor;           // Who donated
        uint256 amountWei;       // How much (in wei)
        uint256 donatedAt;       // When they donated
        uint256 releasedAt;      // When funds were released (proof approved)
        string  campaignTitle;   // Human-readable label
        string  ipfsMetadata;    // IPFS CID → JSON with full impact data
    }

    // ── State ────────────────────────────────────────────────────────────────

    mapping(uint256 => DonationReceipt) public receipts;  // tokenId → receipt
    mapping(address => uint256[])       public donorTokens; // donor → list of tokenIds

    // Per-campaign → per-donor → tokenId (0 = no NFT minted yet)
    mapping(uint256 => mapping(address => uint256)) public campaignDonorToken;

    uint256 private _nextTokenId;
    uint256 public  totalMinted;

    // ── Events ───────────────────────────────────────────────────────────────

    event ReceiptMinted(
        uint256 indexed tokenId,
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amountWei,
        string  ipfsMetadata,
        uint256 timestamp
    );

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(address admin) ERC721("PulseAid Donation Receipt", "PADR") {
        if (admin == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _nextTokenId = 1; // start at 1 so 0 means "no NFT"
    }

    // ── Minting ───────────────────────────────────────────────────────────────

    /**
     * @notice Mint a donation receipt NFT to a donor
     * @dev    Called by ProofValidator (or CampaignFactory) after funds are released.
     *         One NFT per donor per campaign — calling again for the same pair is a no-op.
     * @param campaignId    Campaign identifier
     * @param donor         Donor's wallet address
     * @param amountWei     Donation amount in wei
     * @param donatedAt     Timestamp of the original donation
     * @param campaignTitle Human-readable campaign name
     * @param ipfsMetadata  IPFS CID pointing to full impact JSON
     */
    function mintReceipt(
        uint256 campaignId,
        address donor,
        uint256 amountWei,
        uint256 donatedAt,
        string  memory campaignTitle,
        string  memory ipfsMetadata
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256 tokenId) {
        if (donor == address(0))              revert Errors.ZeroAddress();
        if (amountWei == 0)                   revert Errors.InvalidAmount();
        if (bytes(ipfsMetadata).length == 0)  revert Errors.InvalidIPFSHash();

        // Idempotency — skip if this donor already has a receipt for this campaign
        if (campaignDonorToken[campaignId][donor] != 0) {
            return campaignDonorToken[campaignId][donor];
        }

        tokenId = _nextTokenId++;
        totalMinted++;

        _safeMint(donor, tokenId);
        _setTokenURI(tokenId, ipfsMetadata);

        receipts[tokenId] = DonationReceipt({
            campaignId:    campaignId,
            donor:         donor,
            amountWei:     amountWei,
            donatedAt:     donatedAt,
            releasedAt:    block.timestamp,
            campaignTitle: campaignTitle,
            ipfsMetadata:  ipfsMetadata
        });

        donorTokens[donor].push(tokenId);
        campaignDonorToken[campaignId][donor] = tokenId;

        emit ReceiptMinted(tokenId, campaignId, donor, amountWei, ipfsMetadata, block.timestamp);
    }

    /**
     * @notice Batch-mint receipts for all donors of a campaign
     * @dev    Designed for post-release processing. Safe to call with large arrays
     *         because each mint is independent and already-minted pairs are skipped.
     */
    function batchMintReceipts(
        uint256          campaignId,
        address[] memory donors,
        uint256[] memory amounts,
        uint256[] memory donatedAts,
        string    memory campaignTitle,
        string    memory ipfsMetadata
    ) external onlyRole(MINTER_ROLE) {
        if (donors.length != amounts.length || donors.length != donatedAts.length)
            revert Errors.ArrayLengthMismatch();

        for (uint256 i = 0; i < donors.length; i++) {
            if (donors[i] == address(0) || amounts[i] == 0) continue;
            if (campaignDonorToken[campaignId][donors[i]] != 0) continue; // already minted

            uint256 tokenId = _nextTokenId++;
            totalMinted++;

            _safeMint(donors[i], tokenId);
            _setTokenURI(tokenId, ipfsMetadata);

            receipts[tokenId] = DonationReceipt({
                campaignId:    campaignId,
                donor:         donors[i],
                amountWei:     amounts[i],
                donatedAt:     donatedAts[i],
                releasedAt:    block.timestamp,
                campaignTitle: campaignTitle,
                ipfsMetadata:  ipfsMetadata
            });

            donorTokens[donors[i]].push(tokenId);
            campaignDonorToken[campaignId][donors[i]] = tokenId;

            emit ReceiptMinted(tokenId, campaignId, donors[i], amounts[i], ipfsMetadata, block.timestamp);
        }
    }

    // ── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Get receipt data for a specific token
     */
    function getReceipt(uint256 tokenId)
        external view
        returns (
            uint256 campaignId,
            address donor,
            uint256 amountWei,
            uint256 donatedAt,
            uint256 releasedAt,
            string  memory campaignTitle,
            string  memory ipfsMetadata
        )
    {
        DonationReceipt storage r = receipts[tokenId];
        return (
            r.campaignId, r.donor, r.amountWei,
            r.donatedAt, r.releasedAt,
            r.campaignTitle, r.ipfsMetadata
        );
    }

    /**
     * @notice Get all token IDs held by a donor (their impact portfolio)
     */
    function getDonorReceipts(address donor) external view returns (uint256[] memory) {
        return donorTokens[donor];
    }

    /**
     * @notice Get a donor's token for a specific campaign (0 if none)
     */
    function getDonorCampaignToken(uint256 campaignId, address donor)
        external view returns (uint256)
    {
        return campaignDonorToken[campaignId][donor];
    }

    // ── Overrides ────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}