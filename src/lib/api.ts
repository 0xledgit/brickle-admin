import axios from "axios";
import {
  CreateLeasingDto,
  UpdateLeasingDto,
  LeasingDto,
  CreateTokenizeAsset,
  CampaignDto,
  FileResponseDto,
  ContactDto,
  AdminConfig,
  CreatePaymentDto,
  UserLeasingAgreementDto,
  CreateCompanyDto,
  CompanyDto,
  UserDocumentDto,
  UpdateUserDocumentStatusDto,
} from "./types";
import { createAPIHeaders, createFormDataHeaders } from "@/utils/headers";

export class BrickleAPI {
  private adminConfig: AdminConfig;

  constructor(adminConfig: AdminConfig) {
    this.adminConfig = adminConfig;
  }

  // Leasing endpoints
  async getAllLeasings(): Promise<LeasingDto[]> {
    const response = await axios.get(
      `${this.adminConfig.baseUrl}/api/Leasing`,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async getLeasingById(id: string): Promise<LeasingDto> {
    const response = await axios.get(
      `${this.adminConfig.baseUrl}/api/Leasing/${id}`,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async createLeasing(leasing: CreateLeasingDto): Promise<LeasingDto> {
    const response = await axios.post(
      `${this.adminConfig.baseUrl}/api/Leasing`,
      leasing,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async updateLeasing(
    id: string,
    leasing: UpdateLeasingDto
  ): Promise<LeasingDto> {
    const response = await axios.put(
      `${this.adminConfig.baseUrl}/api/Leasing/${id}`,
      leasing,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async deleteLeasing(id: string): Promise<void> {
    await axios.delete(`${this.adminConfig.baseUrl}/api/Leasing/${id}`, {
      headers: createAPIHeaders(this.adminConfig),
    });
  }

  // Campaign endpoints
  async getAllCampaigns(): Promise<CampaignDto[]> {
    const response = await axios.get(
      `${this.adminConfig.baseUrl}/api/Campaign`,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async createCampaign(campaign: CreateTokenizeAsset): Promise<CampaignDto> {
    const response = await axios.post(
      `${this.adminConfig.baseUrl}/api/Campaign`,
      campaign,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async getCampaignById(id: string): Promise<CampaignDto> {
    const response = await axios.get(
      `${this.adminConfig.baseUrl}/api/Campaign/${id}`,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async finalizeCampaign(
    campaignId: string
  ): Promise<{ success: boolean; message: string }> {
    //const thresholdFactory = process.env.NEXT_PUBLIC_THRESHOLD_FACTORY;
    const response = await axios.post(
      `${this.adminConfig.baseUrl}/api/Campaign/${campaignId}/finalize`,
      {
        userId: this.adminConfig.adminUserId,
      },
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  // File upload endpoints
  async uploadFile(entityId: string, file: File): Promise<FileResponseDto> {
    const formData = new FormData();
    formData.append("entityId", entityId);
    formData.append("file", file);

    const response = await axios.post(
      `${this.adminConfig.baseUrl}/api/File`,
      formData,
      {
        headers: createFormDataHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async getFile(
    entityType: string,
    entityId: string,
    fileType?: string
  ): Promise<FileResponseDto> {
    const url = fileType
      ? `${this.adminConfig.baseUrl}/api/File/${entityType}/${entityId}/${fileType}`
      : `${this.adminConfig.baseUrl}/api/File/${entityType}/${entityId}`;

    const response = await axios.get(url, {
      headers: createAPIHeaders(this.adminConfig),
    });
    return response.data;
  }

  // User endpoints
  async searchUsers(searchTerm?: string): Promise<ContactDto[]> {
    const url = `${this.adminConfig.baseUrl}/api/User/search`;
    const params = searchTerm ? { searchTerm } : {};

    const response = await axios.get(url, {
      headers: createAPIHeaders(this.adminConfig),
      params,
    });
    return response.data;
  }

  // Payment endpoints
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createPayment(payment: CreatePaymentDto): Promise<any> {
    const response = await axios.post(
      `${this.adminConfig.baseUrl}/api/Payment`,
      payment,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  // UserLeasingAgreement endpoints
  async getUserLeasingAgreementsByLeasingId(
    leasingId: string
  ): Promise<UserLeasingAgreementDto[] | UserLeasingAgreementDto> {
    const response = await axios.get(
      `${this.adminConfig.baseUrl}/api/UserLeasingAgreement/leasing/${leasingId}`,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  // Company endpoints
  async getAllCompanies(): Promise<CompanyDto[]> {
    const response = await axios.get(
      `${this.adminConfig.baseUrl}/api/Company`,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  async createCompany(company: CreateCompanyDto): Promise<CompanyDto> {
    const response = await axios.post(
      `${this.adminConfig.baseUrl}/api/Company`,
      company,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }

  // UserDocument endpoints
  async getAllUserDocuments(status?: string): Promise<UserDocumentDto[]> {
    const url = `${this.adminConfig.baseUrl}/api/User/documents/all`;
    const params = status ? { status } : {};

    const response = await axios.get(url, {
      headers: createAPIHeaders(this.adminConfig),
      params,
    });
    return response.data;
  }

  async updateUserDocumentStatus(
    id: string,
    update: UpdateUserDocumentStatusDto
  ): Promise<UserDocumentDto> {
    const response = await axios.put(
      `${this.adminConfig.baseUrl}/api/User/documents/${id}/status`,
      update,
      {
        headers: createAPIHeaders(this.adminConfig),
      }
    );
    return response.data;
  }
}
