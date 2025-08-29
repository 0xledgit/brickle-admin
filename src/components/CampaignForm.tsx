'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  CreateTokenizeAsset,
  CreateCampaignDto,
  CampaignDto,
  LeasingDto,
  CampaignStatusEnum,
  CampaignStatusLabels,
  AdminConfig,
  CreateUserLeasingAgreementDto,
  ContactDto
} from '@/lib/types';
import { BrickleAPI } from '@/lib/api';
import UserAutocomplete from './UserAutocomplete';

interface CampaignFormProps {
  adminConfig: AdminConfig;
  mode: 'create' | 'edit';
  initialData?: CampaignDto;
  onSuccess: (campaign: CampaignDto) => void;
  onCancel: () => void;
}

interface CampaignFormData {
  // Campaign fields
  leasingId: string;
  minCapital: number;
  maxCapital: number;
  status: number;
  baseToken: string;
  brickleAddress: string;
  
  // Leasing Agreement fields
  userId: string;
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

export default function CampaignForm({ adminConfig, mode, initialData, onSuccess, onCancel }: CampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingLeasings, setLoadingLeasings] = useState(true);
  const [error, setError] = useState<string>('');
  const [leasings, setLeasings] = useState<LeasingDto[]>([]);
  const [api] = useState(() => new BrickleAPI(adminConfig));
  
  // User selection state
  const [users, setUsers] = useState<ContactDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<ContactDto | undefined>();
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string>('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CampaignFormData>({
    defaultValues: {
      // Campaign defaults
      leasingId: '',
      minCapital: 0,
      maxCapital: 0,
      status: CampaignStatusEnum.Active,
      baseToken: '',
      brickleAddress: '',
      
      // Leasing Agreement defaults
      userId: '',
      assetValue: 0,
      usefulLife: 0,
      termTime: 0,
      paymentTerm: '',
      agreementType: 0,
      currency: 'COP',
      contractDetails: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      installmentRate: 0,
      residualValue: 0,
      managementFee: 0,
      tokensPurchased: 0,
      leasingCoreAddress: '',
      insurancePercentage: 0,
      ibrRate: 0,
      riskLevel: 0,
      riskRate: 0,
      iva: 0
    }
  });

  useEffect(() => {
    const fetchLeasings = async () => {
      try {
        setLoadingLeasings(true);
        const allLeasings = await api.getAllLeasings();
        setLeasings(allLeasings.filter(l => l.active));
      } catch (err) {
        console.error('Failed to fetch leasings:', err);
        setError('Failed to load leasings');
      } finally {
        setLoadingLeasings(false);
      }
    };

    fetchLeasings();
  }, [api]);

  // Auto-calculate end date based on start date and term time
  const startDate = watch('startDate');
  const termTime = watch('termTime');

  useEffect(() => {
    if (startDate && termTime && termTime > 0) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + parseInt(termTime.toString()));
      setValue('endDate', end.toISOString().split('T')[0]);
    }
  }, [startDate, termTime, setValue]);

  // User search functionality
  const handleUserSearch = async (searchTerm: string) => {
    try {
      setLoadingUsers(true);
      setUserError('');
      const searchResults = await api.searchUsers(searchTerm);
      setUsers(searchResults);
    } catch (err: any) {
      console.error('User search error:', err);
      setUserError('Failed to search users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (user: ContactDto) => {
    setSelectedUser(user);
    setUserError('');
  };

  const onSubmit = async (data: CampaignFormData) => {
    try {
      setLoading(true);
      setError('');

      // Validate user selection
      if (!selectedUser) {
        setUserError('Please select a user (lessee) for this agreement');
        setLoading(false);
        return;
      }

      // Format campaign data
      const campaignData: CreateCampaignDto = {
        leasingId: data.leasingId,
        minCapital: parseFloat(data.minCapital.toString()),
        maxCapital: parseFloat(data.maxCapital.toString()),
        status: parseInt(data.status.toString()),
        baseToken: data.baseToken,
        brickleAddress: data.brickleAddress
      };

      // Format leasing agreement data
      const leasingData: CreateUserLeasingAgreementDto = {
        userId: selectedUser.id,
        leasingId: data.leasingId,
        assetValue: parseFloat(data.assetValue.toString()),
        usefulLife: parseInt(data.usefulLife.toString()),
        termTime: parseInt(data.termTime.toString()),
        paymentTerm: data.paymentTerm,
        agreementType: parseInt(data.agreementType.toString()),
        currency: data.currency,
        contractDetails: data.contractDetails,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : '',
        installmentRate: parseFloat(data.installmentRate.toString()),
        residualValue: parseFloat(data.residualValue.toString()),
        managementFee: parseFloat(data.managementFee.toString()),
        tokensPurchased: parseInt(data.tokensPurchased.toString()),
        leasingCoreAddress: data.leasingCoreAddress,
        insurancePercentage: parseFloat(data.insurancePercentage.toString()),
        ibrRate: parseFloat(data.ibrRate.toString()),
        riskLevel: parseInt(data.riskLevel.toString()),
        riskRate: parseFloat(data.riskRate.toString()),
        iva: parseFloat(data.iva.toString())
      };

      const tokenizeAsset: CreateTokenizeAsset = {
        campaign: campaignData,
        leasing: leasingData
      };

      const result = await api.createCampaign(tokenizeAsset);
      onSuccess(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create campaign');
      console.error('Campaign creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedLeasing = leasings.find(l => l.id === watch('leasingId'));
  
  const statusOptions = Object.keys(CampaignStatusEnum)
    .filter(key => !isNaN(Number(CampaignStatusEnum[key as keyof typeof CampaignStatusEnum])))
    .map(key => ({
      value: CampaignStatusEnum[key as keyof typeof CampaignStatusEnum],
      label: CampaignStatusLabels[CampaignStatusEnum[key as keyof typeof CampaignStatusEnum]]
    }));

  if (loadingLeasings) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">Loading leasings...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === 'create' ? 'Create New Campaign' : 'Edit Campaign'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Campaign Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Leasing <span className="text-red-500">*</span>
              </label>
              <select
                {...register('leasingId', { required: 'Leasing selection is required' })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a leasing --</option>
                {leasings.map(leasing => (
                  <option key={leasing.id} value={leasing.id}>
                    {leasing.name} - {leasing.type} (${leasing.price})
                  </option>
                ))}
              </select>
              {errors.leasingId && <p className="text-red-600 text-sm mt-1">{errors.leasingId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Capital <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('minCapital', { 
                  required: 'Minimum capital is required',
                  min: { value: 0, message: 'Minimum capital must be >= 0' }
                })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              {errors.minCapital && <p className="text-red-600 text-sm mt-1">{errors.minCapital.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Capital <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('maxCapital', { 
                  required: 'Maximum capital is required',
                  min: { value: 0, message: 'Maximum capital must be >= 0' }
                })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              {errors.maxCapital && <p className="text-red-600 text-sm mt-1">{errors.maxCapital.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Token <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('baseToken', { required: 'Base token is required' })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., USDT, USDC, ETH"
              />
              {errors.baseToken && <p className="text-red-600 text-sm mt-1">{errors.baseToken.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brickle Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('brickleAddress', { required: 'Brickle address is required' })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
              {errors.brickleAddress && <p className="text-red-600 text-sm mt-1">{errors.brickleAddress.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>}
            </div>
          </div>
        </div>

        {/* Leasing Agreement Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Leasing Agreement Details</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This section defines the agreement between the selected leasing asset and the customer (lessee) 
              who will acquire it and make monthly payments. Enter the customer's user ID below.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Lessee (Customer) <span className="text-red-500">*</span>
              </label>
              <UserAutocomplete
                users={users}
                onUserSelect={handleUserSelect}
                onSearch={handleUserSearch}
                selectedUser={selectedUser}
                loading={loadingUsers}
                placeholder="Search for the customer who will acquire this leasing..."
                required={true}
                error={userError}
              />
              <p className="text-xs text-gray-500 mt-1">
                Search and select the customer who will acquire the leasing and pay monthly installments
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Value</label>
              <input
                type="number"
                step="0.01"
                {...register('assetValue', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Useful Life (years)</label>
              <input
                type="number"
                {...register('usefulLife', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Term Time (months)</label>
              <input
                type="number"
                {...register('termTime', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Term</label>
              <input
                type="text"
                {...register('paymentTerm')}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Monthly, Quarterly"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Type</label>
              <select
                {...register('agreementType', { required: 'Agreement type is required' })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Operational</option>
                <option value={1}>Financial</option>
              </select>
              {errors.agreementType && <p className="text-red-600 text-sm mt-1">{errors.agreementType.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <input
                type="text"
                {...register('currency')}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="COP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-calculated based on Start Date + Term Time (months)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Installment Rate (%)</label>
              <input
                type="number"
                step="0.000001"
                {...register('installmentRate', { min: 0, max: 100 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.984556"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Residual Value</label>
              <input
                type="number"
                step="0.01"
                {...register('residualValue', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Management Fee</label>
              <input
                type="number"
                step="0.01"
                {...register('managementFee', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tokens Purchased</label>
              <input
                type="number"
                {...register('tokensPurchased', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leasing Core Address</label>
              <input
                type="text"
                {...register('leasingCoreAddress')}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                {...register('insurancePercentage', { min: 0, max: 100 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IBR Rate (%)</label>
              <input
                type="number"
                step="0.01"
                {...register('ibrRate', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <input
                type="number"
                {...register('riskLevel', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Rate (%)</label>
              <input
                type="number"
                step="0.01"
                {...register('riskRate', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IVA Amount</label>
              <input
                type="number"
                step="0.000001"
                {...register('iva', { min: 0 })}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="67000.056765"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contract Details</label>
              <textarea
                {...register('contractDetails')}
                rows={3}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional contract details and terms..."
              />
            </div>
          </div>
        </div>

        {/* Selected Leasing Preview */}
        {selectedLeasing && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">Selected Leasing Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-black">
              <div><strong>Name:</strong> {selectedLeasing.name}</div>
              <div><strong>Type:</strong> {selectedLeasing.type}</div>
              <div><strong>Price:</strong> ${selectedLeasing.price}</div>
              <div><strong>Tokens Available:</strong> {selectedLeasing.tokensAvailable}</div>
              <div><strong>Price per Token:</strong> ${selectedLeasing.pricePerToken}</div>
              <div><strong>TIR:</strong> {selectedLeasing.tir}%</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedLeasing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
}