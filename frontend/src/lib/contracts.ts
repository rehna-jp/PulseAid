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
  PATToken: '0x486733393755Af15B550AF88733CEeE19FD3F254' as `0x${string}`,
  DonationNFT: '0x42f2Ee11Ead859bB5E51C01Aa5A9Ef0a57df5BDf' as `0x${string}`,
  Treasury: '0x40e01c3E6F548a63F29D0C0DaD29F0B45dAa18e4' as `0x${string}`,
  UserRegistry: '0xc1f09BaBbE23B6Bf5242AB18B54EAB442ec1F1a9' as `0x${string}`,
  InstitutionRegistry: 'xfAd776ED103C64bC1f7ADcddFafa38D779b30061' as `0x${string}`,
  EscrowManager: '0x3BefBaC56E3f31a00029a1A876388334f66b9B59' as `0x${string}`,
  CampaignFactory: '0x23ed0E67b86317D0F699c32C789E53b755113DEF' as `0x${string}`,
  ProofValidator: '0xDAbCB592282b63BEC894180FD706D616BC629b43' as `0x${string}`,
  GovernanceDAO: '0x927C2AFF6202d053eA61630e487e8b2c04fC5F3F' as `0x${string}`,
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
