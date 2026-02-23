// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";
import "../tokens/PATToken.sol";
import "../core/InstitutionRegistry.sol";

/**
 * @title GovernanceDAO
 * @notice Simplified governance for hackathon - basic proposal and voting system
 * @dev Uses PAT tokens for voting power with reputation weighting
 */
contract GovernanceDAO is AccessControl, ReentrancyGuard, Pausable {
    // === Constants ===
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 10_000 * 10**18; // 10,000 PAT
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of total supply

    // === Enums ===
    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Queued,
        Executed,
        Cancelled
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    // === Structs ===
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
        mapping(address => bool) hasVoted;
        mapping(address => VoteType) voteChoice;
    }

    // === State Variables ===
    PATToken            public patToken;
    InstitutionRegistry public institutionRegistry;
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCounter;
    
    uint256[] public activeProposals;
    mapping(address => uint256[]) public userProposals;

    // === Constructor ===
    constructor(address _patToken, address _institutionRegistry, address admin) {
        if (_patToken == address(0) || _institutionRegistry == address(0) || admin == address(0)) {
            revert Errors.ZeroAddress();
        }
        
        patToken            = PATToken(_patToken);
        institutionRegistry = InstitutionRegistry(payable(_institutionRegistry));
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
    }

    // === Proposal Functions ===

    /**
     * @notice Create a new governance proposal
     * @param title Proposal title
     * @param description Detailed description
     * @param targets Contract addresses to call
     * @param values ETH values to send
     * @param calldatas Function call data
     */
    function propose(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external whenNotPaused returns (uint256) {
        // Validation
        if (patToken.balanceOf(msg.sender) < MIN_PROPOSAL_THRESHOLD) {
            revert Errors.InsufficientVotingPower();
        }
        if (bytes(title).length == 0 || bytes(description).length == 0) {
            revert Errors.InvalidParameter();
        }
        if (targets.length != values.length || targets.length != calldatas.length) {
            revert Errors.ArrayLengthMismatch();
        }
        if (targets.length == 0) {
            revert Errors.InvalidParameter();
        }
        
        uint256 proposalId = proposalCounter++;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        proposal.state = ProposalState.Active;
        
        activeProposals.push(proposalId);
        userProposals[msg.sender].push(proposalId);
        
        uint256 votingEnds = block.timestamp + VOTING_PERIOD;
        
        emit Events.ProposalCreated(
            proposalId,
            msg.sender,
            description,
            votingEnds,
            block.timestamp
        );
        
        return proposalId;
    }

    /**
     * @notice Cast vote on a proposal
     * @param proposalId Proposal identifier
     * @param voteType 0 = Against, 1 = For, 2 = Abstain
     */
    function castVote(uint256 proposalId, uint8 voteType) external {
        if (voteType > 2) revert Errors.InvalidVoteType();
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.state != ProposalState.Active) {
            revert Errors.ProposalNotActive();
        }
        if (proposal.hasVoted[msg.sender]) revert Errors.AlreadyVoted();
        if (block.timestamp > proposal.endTime) {
            revert Errors.VotingPeriodEnded();
        }
        
        // v5.0: Reputation-weighted voting power
        uint256 votingPower = patToken.balanceOf(msg.sender);
        if (votingPower == 0) revert Errors.InsufficientVotingPower();

        // Apply multipliers based on reputation tiers
        InstitutionRegistry.ReputationTier tier = institutionRegistry.getReputationTier(msg.sender);
        if (tier == InstitutionRegistry.ReputationTier.Elite) {
            votingPower *= 2;
        } else if (tier == InstitutionRegistry.ReputationTier.Good) {
            votingPower = (votingPower * 15) / 10; // 1.5x
        }
        
        proposal.hasVoted[msg.sender] = true;
        proposal.voteChoice[msg.sender] = VoteType(voteType);
        
        if (voteType == uint8(VoteType.For)) {
            proposal.forVotes += votingPower;
        } else if (voteType == uint8(VoteType.Against)) {
            proposal.againstVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }
        
        bool support = voteType == uint8(VoteType.For);
        
        emit Events.VoteCast(
            proposalId,
            msg.sender,
            support,
            votingPower,
            block.timestamp
        );
        
        // Mint tokens for voting participation
        try patToken.mintForVoting(msg.sender) {} catch {}
    }

    /**
     * @notice Finalize a proposal after voting ends
     * @param proposalId Proposal identifier
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.state != ProposalState.Active) {
            revert Errors.ProposalNotActive();
        }
        if (block.timestamp <= proposal.endTime) {
            revert Errors.VotingPeriodNotEnded();
        }
        
        // Check quorum
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 quorum = (patToken.totalSupply() * QUORUM_PERCENTAGE) / 100;
        
        if (totalVotes < quorum) {
            proposal.state = ProposalState.Defeated;
            _removeFromActiveProposals(proposalId);
            return;
        }
        
        // Check if passed
        if (proposal.forVotes > proposal.againstVotes) {
            proposal.state = ProposalState.Succeeded;
            proposal.executionTime = block.timestamp + EXECUTION_DELAY;
        } else {
            proposal.state = ProposalState.Defeated;
            _removeFromActiveProposals(proposalId);
        }
    }

    /**
     * @notice Queue a succeeded proposal for execution
     * @param proposalId Proposal identifier
     */
    function queueProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.state != ProposalState.Succeeded) {
            revert Errors.ProposalNotActive();
        }
        if (block.timestamp < proposal.executionTime) {
            revert Errors.VotingPeriodNotEnded();
        }
        
        proposal.state = ProposalState.Queued;
    }

    /**
     * @notice Execute a queued proposal
     * @param proposalId Proposal identifier
     */
    function executeProposal(uint256 proposalId) 
        external 
        onlyRole(EXECUTOR_ROLE) 
        nonReentrant 
    {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.state != ProposalState.Queued) {
            revert Errors.ProposalNotActive();
        }
        if (proposal.executionTime > block.timestamp) {
            revert Errors.VotingPeriodNotEnded();
        }
        
        proposal.state = ProposalState.Executed;
        _removeFromActiveProposals(proposalId);
        
        // Execute proposal calls
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            
            if (!success) {
                proposal.state = ProposalState.Defeated;
                revert Errors.ProposalExecutionFailed();
            }
        }
        
        emit Events.ProposalExecuted(proposalId, true, block.timestamp);
    }

    /**
     * @notice Cancel a proposal (only by proposer before execution)
     * @param proposalId Proposal identifier
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.proposer != msg.sender) revert Errors.Unauthorized();
        if (proposal.state == ProposalState.Executed) {
            revert Errors.ProposalAlreadyExecuted();
        }
        
        proposal.state = ProposalState.Cancelled;
        _removeFromActiveProposals(proposalId);
    }

    // === View Functions ===

    /**
     * @notice Get proposal state
     */
    function getProposalState(uint256 proposalId) 
        external 
        view 
        returns (ProposalState) 
    {
        return proposals[proposalId].state;
    }

    /**
     * @notice Get proposal details
     */
    function getProposal(uint256 proposalId) 
        external 
        view 
        returns (
            address proposer,
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 forVotes,
            uint256 againstVotes,
            ProposalState state
        ) 
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.state
        );
    }

    /**
     * @notice Check if user has voted
     */
    function hasVoted(uint256 proposalId, address voter) 
        external 
        view 
        returns (bool) 
    {
        return proposals[proposalId].hasVoted[voter];
    }

    /**
     * @notice Get user's vote
     */
    function getVote(uint256 proposalId, address voter) 
        external 
        view 
        returns (VoteType) 
    {
        return proposals[proposalId].voteChoice[voter];
    }

    /**
     * @notice Get active proposals
     */
    function getActiveProposals() external view returns (uint256[] memory) {
        return activeProposals;
    }

    /**
     * @notice Get user's proposals
     */
    function getUserProposals(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userProposals[user];
    }

    /**
     * @notice Calculate current quorum requirement
     */
    function getQuorumVotes() external view returns (uint256) {
        return (patToken.totalSupply() * QUORUM_PERCENTAGE) / 100;
    }

    // === Internal Functions ===

    function _removeFromActiveProposals(uint256 proposalId) internal {
        uint256 length = activeProposals.length;
        for (uint256 i = 0; i < length; i++) {
            if (activeProposals[i] == proposalId) {
                activeProposals[i] = activeProposals[length - 1];
                activeProposals.pop();
                break;
            }
        }
    }

    // === Admin Functions ===

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // === Receive ETH ===
    receive() external payable {}
}