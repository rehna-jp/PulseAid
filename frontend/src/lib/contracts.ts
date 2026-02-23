import PATTokenJson from '@/contracts/PATToken.json';
import InstitutionRegistryJson from '@/contracts/InstitutionRegistry.json';
import CampaignFactoryJson from '@/contracts/CampaignFactory.json';
import ProofValidatorJson from '@/contracts/ProofValidator.json';
import EscrowManagerJson from '@/contracts/EscrowManager.json';
import DonationNFTJson from '@/contracts/DonationNFT.json';
import TreasuryJson from '@/contracts/Treasury.json';
import UserRegistryJson from '@/contracts/UserRegistry.json';
import GovernanceDAOJson from '@/contracts/GovernanceDAO.json';

export const CONTRACT_ADDRESSES = {
  PATToken: '0x74E58c83c7dE2F19CD455FEDBddD942c0060E1f9' as `0x${string}`,
  DonationNFT: '0x1e4B92cDf67323A4394f561679c4DfE388B797cf' as `0x${string}`,
  Treasury: '0x33f0C8358EC6AB8BE5BC38c10a10df1d4D027dd7' as `0x${string}`,
  UserRegistry: '0x4B798e873Ba1A25a131508146D2fd7bBB4061277' as `0x${string}`,
  InstitutionRegistry: '0x703C13233e066636D3B796C1Fcd48A7807d02ed6' as `0x${string}`,
  EscrowManager: '0x209Ddd8D9CfAbAAB3C56B27757C7794cA6FeC2D4' as `0x${string}`,
  CampaignFactory: '0xD8A8eeEfa1D94c3B74c85Cd05728D41996d7420C' as `0x${string}`,
  ProofValidator: '0xd052f28766bB140DEeA0E952c7965154a35605ca' as `0x${string}`,
  GovernanceDAO: '0xd4979319f9faA3fe5662dece5311cDF8E115DEc2' as `0x${string}`,
} as const;

// Export cleaned ABIs (only the `abi` field)
export const ABIS = {
  PATToken: PATTokenJson.abi,
  InstitutionRegistry: InstitutionRegistryJson.abi,
  CampaignFactory: CampaignFactoryJson.abi,
  ProofValidator: ProofValidatorJson.abi,
  EscrowManager: EscrowManagerJson.abi,
  DonationNFT: DonationNFTJson.abi,
  Treasury: TreasuryJson.abi,
  UserRegistry: UserRegistryJson.abi,
  GovernanceDAO: GovernanceDAOJson.abi,
} as const;

export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
