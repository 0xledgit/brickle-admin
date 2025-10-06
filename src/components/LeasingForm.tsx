'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateLeasingDto, UpdateLeasingDto, LeasingDto, LeasingTypeEnum, LiquidityLevelEnum, LeasingTypeLabels, LiquidityLevelLabels, AdminConfig, CompanyDto, CreateCompanyDto, OperationMeasureEnum, AssetDetailDto } from '@/lib/types';
import { BrickleAPI } from '@/lib/api';
import FileUpload from './FileUpload';

interface LeasingFormProps {
  adminConfig: AdminConfig;
  mode: 'create' | 'edit';
  initialData?: LeasingDto;
  onSuccess: (leasing: LeasingDto) => void;
  onCancel: () => void;
}

export default function LeasingForm({ adminConfig, mode, initialData, onSuccess, onCancel }: LeasingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [api] = useState(() => new BrickleAPI(adminConfig));
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompany, setNewCompany] = useState<CreateCompanyDto>({
    name: '',
    operationTime: 0,
    operationMeasure: OperationMeasureEnum.YEARLY,
    creditRating: '',
    leasingContract: '',
    userId: adminConfig.adminUserId,
  });
  const [details, setDetails] = useState<AssetDetailDto[]>(
    initialData?.details || []
  );

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateLeasingDto | UpdateLeasingDto>({
    defaultValues: initialData ? {
      name: initialData.name,
      quantity: initialData.quantity,
      price: initialData.price,
      tokens: initialData.tokens,
      tokensAvailable: initialData.tokensAvailable,
      pricePerToken: initialData.pricePerToken,
      description: initialData.description,
      type: initialData.type,
      contractTime: initialData.contractTime ? initialData.contractTime.split('T')[0] : '',
      liquidity: initialData.liquidity,
      contractAddress: initialData.contractAddress,
      tir: initialData.tir,
      active: initialData.active,
      coverImageUrl: initialData.coverImageUrl,
      miniatureImageUrl: initialData.miniatureImageUrl,
      companyId: initialData.companyId
    } : {
      name: '',
      quantity: 0,
      price: 0,
      tokens: 0,
      tokensAvailable: 0,
      pricePerToken: 0,
      description: '',
      type: LeasingTypeEnum.Maquinaria,
      contractTime: '',
      liquidity: LiquidityLevelEnum.Low,
      contractAddress: '',
      tir: 0,
      active: true,
      coverImageUrl: '',
      miniatureImageUrl: '',
      companyId: ''
    }
  });

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await api.getAllCompanies();
        setCompanies(companiesData);
      } catch (err: unknown) {
        console.error('Failed to load companies:', err);
      }
    };
    loadCompanies();
  }, [api]);

  const handleAddDetail = () => {
    if (details.length < 8) {
      setDetails([...details, { title: '', value: '' }]);
    }
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleDetailChange = (index: number, field: 'title' | 'value', value: string) => {
    const updatedDetails = [...details];
    updatedDetails[index][field] = value;
    setDetails(updatedDetails);
  };

  const handleCreateCompany = async () => {
    try {
      const createdCompany = await api.createCompany(newCompany);
      setCompanies([...companies, createdCompany]);
      setValue('companyId', createdCompany.id);
      setShowNewCompanyForm(false);
      setNewCompany({
        name: '',
        operationTime: 0,
        operationMeasure: OperationMeasureEnum.YEARLY,
        creditRating: '',
        leasingContract: '',
        userId: adminConfig.adminUserId,
      });
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create company';
      setError(errorMessage);
    }
  };

  const onSubmit = async (data: CreateLeasingDto | UpdateLeasingDto) => {
    try {
      setLoading(true);
      setError('');

      // Convert and format data to match API expectations
      const formattedData = {
        ...data,
        // Convert string numbers to actual numbers
        quantity: parseInt(data.quantity.toString()),
        price: parseFloat(data.price.toString()),
        tokens: parseInt(data.tokens.toString()),
        tokensAvailable: parseInt(data.tokensAvailable.toString()),
        pricePerToken: parseFloat(data.pricePerToken.toString()),
        tir: parseFloat(data.tir.toString()),
        // Convert enum values to numbers
        type: parseInt(data.type.toString()) as LeasingTypeEnum,
        liquidity: parseInt(data.liquidity.toString()) as LiquidityLevelEnum,
        // Convert contractTime to ISO string if provided
        contractTime: data.contractTime ? new Date(data.contractTime).toISOString() : undefined,
        // Add details array
        details: details.filter(d => d.title && d.value)
      };

      let result: LeasingDto;
      if (mode === 'create') {
        result = await api.createLeasing(formattedData as CreateLeasingDto);
      } else {
        result = await api.updateLeasing(initialData!.id, formattedData as UpdateLeasingDto);
      }

      onSuccess(result);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || `Failed to ${mode} leasing`;
      setError(errorMessage);
      console.error(`${mode} error:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, propertyName: 'coverImageUrl' | 'miniatureImageUrl') => {
    // Use the admin user ID as the entity ID for file uploads
    const entityId = adminConfig.adminUserId;
    if (!entityId) {
      throw new Error('Admin User ID is required for file uploads');
    }

    const result = await api.uploadFile(entityId, file);
    setValue(propertyName, result.fileUrl);
    return result;
  };

  // Get numeric enum values for form options
  const leasingTypes = Object.keys(LeasingTypeEnum)
    .filter(key => !isNaN(Number(LeasingTypeEnum[key as keyof typeof LeasingTypeEnum])))
    .map(key => ({
      value: LeasingTypeEnum[key as keyof typeof LeasingTypeEnum],
      label: LeasingTypeLabels[LeasingTypeEnum[key as keyof typeof LeasingTypeEnum]]
    }));

  const liquidityLevels = Object.keys(LiquidityLevelEnum)
    .filter(key => !isNaN(Number(LiquidityLevelEnum[key as keyof typeof LiquidityLevelEnum])))
    .map(key => ({
      value: LiquidityLevelEnum[key as keyof typeof LiquidityLevelEnum],
      label: LiquidityLevelLabels[LiquidityLevelEnum[key as keyof typeof LiquidityLevelEnum]]
    }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === 'create' ? 'Create New Leasing' : 'Edit Leasing'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              {...register('type', { required: 'Type is required' })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {leasingTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              {...register('quantity', { required: 'Quantity is required', min: 0 })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <input
              type="number"
              step="0.01"
              {...register('price', { required: 'Price is required', min: 0 })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tokens</label>
            <input
              type="number"
              {...register('tokens', { required: 'Tokens is required', min: 0 })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.tokens && <p className="text-red-600 text-sm mt-1">{errors.tokens.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tokens Available</label>
            <input
              type="number"
              {...register('tokensAvailable', { required: 'Tokens Available is required', min: 0 })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.tokensAvailable && <p className="text-red-600 text-sm mt-1">{errors.tokensAvailable.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price per Token</label>
            <input
              type="number"
              step="0.01"
              {...register('pricePerToken', { required: 'Price per Token is required', min: 0 })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.pricePerToken && <p className="text-red-600 text-sm mt-1">{errors.pricePerToken.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">TIR (%)</label>
            <input
              type="number"
              step="0.01"
              {...register('tir', { required: 'TIR is required' })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.tir && <p className="text-red-600 text-sm mt-1">{errors.tir.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Liquidity</label>
            <select
              {...register('liquidity', { required: 'Liquidity is required' })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {liquidityLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contract Time</label>
            <input
              type="date"
              {...register('contractTime')}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contract Address</label>
            <input
              type="text"
              {...register('contractAddress', { required: 'Contract Address is required' })}
              className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.contractAddress && <p className="text-red-600 text-sm mt-1">{errors.contractAddress.message}</p>}
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('active')}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            onFileUpload={(file) => handleFileUpload(file, 'coverImageUrl')}
            entityType="Leasing"
            propertyName="Cover"
            currentUrl={watch('coverImageUrl')}
            disabled={loading}
          />

          <FileUpload
            onFileUpload={(file) => handleFileUpload(file, 'miniatureImageUrl')}
            entityType="Leasing"
            propertyName="Miniature"
            currentUrl={watch('miniatureImageUrl')}
            disabled={loading}
          />
        </div>

        {/* Company Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Company</label>
              <div className="flex gap-2">
                <select
                  {...register('companyId')}
                  className="flex-1 text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Select a company...</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name} - {company.creditRating}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCompanyForm(!showNewCompanyForm)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={loading}
                >
                  {showNewCompanyForm ? 'Cancel' : 'New Company'}
                </button>
              </div>
            </div>

            {showNewCompanyForm && (
              <div className="bg-gray-50 p-4 rounded-md space-y-4">
                <h4 className="font-medium text-gray-900">Create New Company</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credit Rating</label>
                    <input
                      type="text"
                      value={newCompany.creditRating}
                      onChange={(e) => setNewCompany({ ...newCompany, creditRating: e.target.value })}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operation Time</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newCompany.operationTime}
                      onChange={(e) => setNewCompany({ ...newCompany, operationTime: parseFloat(e.target.value) })}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operation Measure</label>
                    <select
                      value={newCompany.operationMeasure}
                      onChange={(e) => setNewCompany({ ...newCompany, operationMeasure: e.target.value as OperationMeasureEnum })}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value={OperationMeasureEnum.YEARLY}>Yearly</option>
                      <option value={OperationMeasureEnum.MONTHLY}>Monthly</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leasing Contract (Optional)</label>
                    <input
                      type="text"
                      value={newCompany.leasingContract}
                      onChange={(e) => setNewCompany({ ...newCompany, leasingContract: e.target.value })}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCompany}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  Create Company
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Leasing Details</h3>
            <button
              type="button"
              onClick={handleAddDetail}
              disabled={loading || details.length >= 8}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Add Detail ({details.length}/8)
            </button>
          </div>

          <div className="space-y-3">
            {details.map((detail, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={detail.title}
                    onChange={(e) => handleDetailChange(index, 'title', e.target.value)}
                    className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Color, Size, Weight"
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                    <input
                      type="text"
                      value={detail.value}
                      onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Blue, 10kg, Large"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDetail(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 self-end"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {details.length === 0 && (
              <p className="text-gray-500 text-sm italic">No details added yet. Click &quot;Add Detail&quot; to add characteristics.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
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
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Leasing' : 'Update Leasing'}
          </button>
        </div>
      </form>
    </div>
  );
}