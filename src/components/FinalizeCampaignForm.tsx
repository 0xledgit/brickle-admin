import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CampaignDto, LeasingDto, AdminConfig, FinalizeCampaignResponse } from '@/lib/types';
import { BrickleAPI } from '@/lib/api';

interface FinalizeCampaignFormProps {
  adminConfig: AdminConfig;
  onSuccess: (campaignId: string) => void;
  onCancel: () => void;
}

interface FinalizeCampaignFormData {
  campaignId: string;
}

export default function FinalizeCampaignForm({ adminConfig, onSuccess, onCancel }: FinalizeCampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastResult, setLastResult] = useState<FinalizeCampaignResponse | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [leasings, setLeasings] = useState<LeasingDto[]>([]);
  const [api] = useState(() => new BrickleAPI(adminConfig));

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FinalizeCampaignFormData>({
    defaultValues: {
      campaignId: ''
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [allCampaigns, allLeasings] = await Promise.all([
          api.getAllCampaigns(),
          api.getAllLeasings()
        ]);

        // Filter only active campaigns (status 0)
        setCampaigns(allCampaigns.filter(campaign => campaign.status === 0));
        setLeasings(allLeasings);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load campaigns or leasings');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [api]);

  const onSubmit = async (data: FinalizeCampaignFormData) => {
    try {
      setLoading(true);
      setError('');
      setLastResult(null);

      const selectedCampaign = campaigns.find(c => c.id === data.campaignId);
      if (!selectedCampaign) {
        setError('Please select a valid campaign');
        return;
      }

      // Backend calls smart contract finalizeCampaign and persists leasingCore/token to Leasing and UserLeasingAgreement
      const result = await api.finalizeCampaign(selectedCampaign.id, {
        brickleAssumeInsurance: true,
      });
      setLastResult(result);
      onSuccess(selectedCampaign.id);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to finalize campaign';
      setError(errorMessage);
      console.error('Campaign finalization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === watch('campaignId'));
  // Find associated leasing for preview
  const selectedLeasing = selectedCampaign ? leasings.find(l => l.id === selectedCampaign.leasingId) : undefined;

  if (loadingData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Finalize Campaign</h2>
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

      {lastResult && lastResult.success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          <p className="font-semibold mb-2">Campaña finalizada correctamente. Direcciones actualizadas en BD:</p>
          <p className="font-mono text-xs break-all"><strong>LeasingCore (contract_address / leasingCoreAddress):</strong> {lastResult.leasingCoreAddress}</p>
          <p className="font-mono text-xs break-all mt-1"><strong>Token (baseToken):</strong> {lastResult.tokenAddress}</p>
          {lastResult.transactionHash && (
            <p className="font-mono text-xs break-all mt-1"><strong>TxHash:</strong> {lastResult.transactionHash}</p>
          )}
        </div>
      )}

      {campaigns.length === 0 && !loadingData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          No active campaigns available to finalize.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="text-blue-400">ℹ️</div>
            <div className="ml-3 text-sm text-blue-700">
              <p><strong>Campaign Finalization</strong></p>
              <p>This action calls the backend, which runs the smart contract <code>finalizeCampaign</code>, then updates <strong>Leasing.contract_address</strong> and <strong>UserLeasingAgreement.leasingCoreAddress</strong> with the addresses returned by the contract.</p>
              <p className="mt-2">Only active campaigns can be finalized. This action cannot be undone.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Campaign to Finalize <span className="text-red-500">*</span>
          </label>
          <select
            {...register('campaignId', { required: 'Campaign selection is required' })}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={campaigns.length === 0}
          >
            <option value="">-- Select an active campaign --</option>
            {campaigns.map(campaign => {
              // Try to find matching leasing by id
              const leasingName = leasings.find(l => l.id === campaign.leasingId)?.name || 'Unknown Asset';
              return (
                <option key={campaign.id} value={campaign.id}>
                  {leasingName} (Campaign {campaign.id}) - Min: ${campaign.minCapital}
                </option>
              );
            })}
          </select>
          {errors.campaignId && <p className="text-red-600 text-sm mt-1">{errors.campaignId.message}</p>}
        </div>

        {/* Selected Campaign Preview */}
        {selectedCampaign && (
          <div className="bg-gray-50 p-4 rounded-md border-l-4 border-red-400">
            <h3 className="font-medium text-gray-900 mb-2">⚠️ Campaign to be Finalized</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
              <div><strong>Campaign ID:</strong> {selectedCampaign.id}</div>
              {selectedLeasing && <div><strong>Asset Name:</strong> {selectedLeasing.name}</div>}
              <div><strong>Min Capital:</strong> ${selectedCampaign.minCapital}</div>
              <div><strong>Max Capital:</strong> ${selectedCampaign.maxCapital}</div>
              <div><strong>Base Token:</strong> {selectedCampaign.baseToken}</div>
              <div><strong>Contract Address:</strong> {selectedCampaign.brickleAddress}</div>
            </div>
            <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-xs">
              <strong>Warning:</strong> This action will permanently finalize this campaign and cannot be undone.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedCampaign || campaigns.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Finalizing...' : '⚠️ Finalize Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
}