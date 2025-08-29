import axios from 'axios';
import { 
  CreateLeasingDto, 
  UpdateLeasingDto, 
  LeasingDto, 
  CreateTokenizeAsset, 
  CampaignDto,
  FileResponseDto,
  ContactDto,
  AdminConfig 
} from './types';
import { createAPIHeaders, createFormDataHeaders } from '@/utils/headers';

export class BrickleAPI {
  private adminConfig: AdminConfig;

  constructor(adminConfig: AdminConfig) {
    this.adminConfig = adminConfig;
  }

  // Leasing endpoints
  async getAllLeasings(): Promise<LeasingDto[]> {
    const response = await axios.get(`${this.adminConfig.baseUrl}/api/Leasing`, {
      headers: createAPIHeaders(this.adminConfig)
    });
    return response.data;
  }

  async getLeasingById(id: string): Promise<LeasingDto> {
    const response = await axios.get(`${this.adminConfig.baseUrl}/api/Leasing/${id}`, {
      headers: createAPIHeaders(this.adminConfig)
    });
    return response.data;
  }

  async createLeasing(leasing: CreateLeasingDto): Promise<LeasingDto> {
    const response = await axios.post(`${this.adminConfig.baseUrl}/api/Leasing`, leasing, {
      headers: createAPIHeaders(this.adminConfig)
    });
    return response.data;
  }

  async updateLeasing(id: string, leasing: UpdateLeasingDto): Promise<LeasingDto> {
    const response = await axios.put(`${this.adminConfig.baseUrl}/api/Leasing/${id}`, leasing, {
      headers: createAPIHeaders(this.adminConfig)
    });
    return response.data;
  }

  async deleteLeasing(id: string): Promise<void> {
    await axios.delete(`${this.adminConfig.baseUrl}/api/Leasing/${id}`, {
      headers: createAPIHeaders(this.adminConfig)
    });
  }

  // Campaign endpoints
  async createCampaign(campaign: CreateTokenizeAsset): Promise<CampaignDto> {
    const response = await axios.post(`${this.adminConfig.baseUrl}/api/Campaign`, campaign, {
      headers: createAPIHeaders(this.adminConfig)
    });
    return response.data;
  }

  async getCampaignById(id: string): Promise<CampaignDto> {
    const response = await axios.get(`${this.adminConfig.baseUrl}/api/Campaign/${id}`, {
      headers: createAPIHeaders(this.adminConfig)
    });
    return response.data;
  }

  // File upload endpoints
  async uploadFile(entityId: string, file: File): Promise<FileResponseDto> {
    const formData = new FormData();
    formData.append('entityId', entityId);
    formData.append('file', file);

    const response = await axios.post(`${this.adminConfig.baseUrl}/api/File`, formData, {
      headers: createFormDataHeaders(this.adminConfig)
    });
    return response.data;
  }

  async getFile(entityType: string, entityId: string, fileType?: string): Promise<FileResponseDto> {
    const url = fileType 
      ? `${this.adminConfig.baseUrl}/api/File/${entityType}/${entityId}/${fileType}`
      : `${this.adminConfig.baseUrl}/api/File/${entityType}/${entityId}`;
    
    const response = await axios.get(url, {
      headers: createAPIHeaders(this.adminConfig)
    });
    return response.data;
  }

  // User endpoints
  async searchUsers(searchTerm?: string): Promise<ContactDto[]> {
    const url = `${this.adminConfig.baseUrl}/api/User/search`;
    const params = searchTerm ? { searchTerm } : {};
    
    const response = await axios.get(url, {
      headers: createAPIHeaders(this.adminConfig),
      params
    });
    return response.data;
  }
}