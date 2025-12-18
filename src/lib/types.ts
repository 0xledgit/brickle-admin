// Enums with numeric values to match API
export enum LeasingTypeEnum {
  Maquinaria = 1,
  Electronicos = 2,
  Vehiculos = 3,
  Tecnologia = 4,
  Energia = 5,
  Salud = 6,
  Mobiliario = 7,
  Agricultura = 8,
}

export enum LiquidityLevelEnum {
  Low = 1,
  Medium = 2,
  High = 3,
}

// Helper objects for form display
export const LeasingTypeLabels = {
  [LeasingTypeEnum.Maquinaria]: "Maquinaria",
  [LeasingTypeEnum.Electronicos]: "Electronicos",
  [LeasingTypeEnum.Vehiculos]: "Vehiculos",
  [LeasingTypeEnum.Tecnologia]: "Tecnologia",
  [LeasingTypeEnum.Energia]: "Energia",
  [LeasingTypeEnum.Salud]: "Salud",
  [LeasingTypeEnum.Mobiliario]: "Mobiliario",
  [LeasingTypeEnum.Agricultura]: "Agricultura",
};

export const LiquidityLevelLabels = {
  [LiquidityLevelEnum.Low]: "Low",
  [LiquidityLevelEnum.Medium]: "Medium",
  [LiquidityLevelEnum.High]: "High",
};

export enum CampaignStatusEnum {
  Active = 0,
  Inactive = 1,
  Completed = 2,
}

export const CampaignStatusLabels = {
  [CampaignStatusEnum.Active]: "Active",
  [CampaignStatusEnum.Inactive]: "Inactive",
  [CampaignStatusEnum.Completed]: "Completed",
};

// DTOs
export interface CreateLeasingDto {
  name: string;
  quantity: number;
  price: number;
  tokens: number;
  tokensAvailable: number;
  pricePerToken: number;
  description?: string;
  type: LeasingTypeEnum;
  contractTime?: string;
  liquidity: LiquidityLevelEnum;
  coverImageUrl?: string;
  miniatureImageUrl?: string;
  contractAddress: string;
  tir: number;
  active: boolean;
  details?: AssetDetailDto[];
  companyId?: string;
}

export interface UpdateLeasingDto extends CreateLeasingDto {
  id?: string;
}

export interface LeasingDto extends CreateLeasingDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateCampaignDto {
  leasingId: string;
  minCapital: number;
  maxCapital: number;
  status: number; // 0 for Active, 1 for Inactive, 2 for Completed
  baseToken: string;
  brickleAddress: string;
  campaignAddress?: string;
  campaignTx?: string;
}

export interface CampaignDto extends CreateCampaignDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTokenizeAsset {
  campaign: CreateCampaignDto;
  leasing: CreateUserLeasingAgreementDto;
}

export interface CreateUserLeasingAgreementDto {
  userId: string;
  leasingId: string;
  assetValue: number;
  usefulLife: number;
  termTime: number;
  paymentTerm: string;
  agreementType: number;
  currency: string;
  contractDetails: string;
  startDate: string;
  endDate: string;
  installmentRate: number;
  residualValue: number;
  managementFee: number;
  tokensPurchased: number;
  leasingCoreAddress: string;
  insurancePercentage: number;
  ibrRate: number;
  riskLevel: number;
  riskRate: number;
  iva: number;
}

export interface AssetDetailDto {
  title: string;
  value: string;
}

// Company types
export enum OperationMeasureEnum {
  YEARLY = "Yearly",
  MONTHLY = "Monthly",
}

export interface CreateCompanyDto {
  name: string;
  operationTime: number;
  operationMeasure: OperationMeasureEnum;
  creditRating: string;
  leasingContract?: string;
  userId: string;
}

export interface CompanyDto extends CreateCompanyDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  walletAddress?: string;
  profilePictureUrl?: string;
}

export interface HeaderRequestModel {
  correlationId: string;
  user: string;
  source: string;
  requestDate: string;
}

export interface FileResponseDto {
  fileUrl: string;
}

export interface UploadFileRequestDto {
  entityId: string;
  file: File;
}

// Admin configuration
export interface AdminConfig {
  apiKey: string;
  ownerEmail: string;
  baseUrl: string;
  adminUserId: string;
}

// Payment types
export interface PermitSignature {
  v: number;
  r: string;
  s: string;
}

export interface CreatePaymentDto {
  userLeasingAgreementId: string;
  paymentAmount: string;
  deadline: number;
  permitSignature: PermitSignature;
}

export interface UserLeasingAgreementDto {
  id: string;
  userId: string;
  leasingId: string;
  assetValue: number;
  usefulLife: number;
  termTime: number;
  paymentTerm: string;
  agreementType: number;
  currency: string;
  contractDetails: string;
  startDate: string;
  endDate: string;
  installmentRate: number;
  residualValue: number;
  managementFee: number;
  tokensPurchased: number;
  leasingCoreAddress: string;
  insurancePercentage: number;
  ibrRate: number;
  riskLevel: number;
  riskRate: number;
  iva: number;
  createdAt: string;
  updatedAt: string;
  leasing?: LeasingDto;
}

export interface UserDocumentDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  name: string;
  documentUrl: string;
  status: string;
  observation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDocumentStatusDto {
  status: string;
  observation?: string;
}
