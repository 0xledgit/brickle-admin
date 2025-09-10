'use client';

import { useState } from 'react';
import { AdminConfig, LeasingDto, CampaignDto } from '@/lib/types';
import AdminSetup from '@/components/AdminSetup';
import LeasingForm from '@/components/LeasingForm';
import CampaignForm from '@/components/CampaignForm';
import FinalizeCampaignForm from '@/components/FinalizeCampaignForm';
import PaymentForm from '@/components/PaymentForm';

export default function Home() {
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [showLeasingForm, setShowLeasingForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showFinalizeCampaignForm, setShowFinalizeCampaignForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleConfigSave = (config: AdminConfig) => {
    setAdminConfig(config);
    setSuccessMessage('Configuration saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleLeasingSuccess = (leasing: LeasingDto) => {
    setShowLeasingForm(false);
    setSuccessMessage(`Leasing "${leasing.name}" created successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleCampaignSuccess = (campaign: CampaignDto) => {
    setShowCampaignForm(false);
    setSuccessMessage(`Campaign for leasing ${campaign.leasingId} created successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleFinalizeCampaignSuccess = (campaignId: string) => {
    setShowFinalizeCampaignForm(false);
    setSuccessMessage(`Campaign ${campaignId} finalized successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSuccessMessage(`Payment created successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  if (showLeasingForm && adminConfig) {
    return (
      <LeasingForm
        adminConfig={adminConfig}
        mode="create"
        onSuccess={handleLeasingSuccess}
        onCancel={() => setShowLeasingForm(false)}
      />
    );
  }

  if (showCampaignForm && adminConfig) {
    return (
      <CampaignForm
        adminConfig={adminConfig}
        mode="create"
        onSuccess={handleCampaignSuccess}
        onCancel={() => setShowCampaignForm(false)}
      />
    );
  }

  if (showFinalizeCampaignForm && adminConfig) {
    return (
      <FinalizeCampaignForm
        adminConfig={adminConfig}
        onSuccess={handleFinalizeCampaignSuccess}
        onCancel={() => setShowFinalizeCampaignForm(false)}
      />
    );
  }

  if (showPaymentForm && adminConfig) {
    return (
      <PaymentForm
        adminConfig={adminConfig}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowPaymentForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="text-green-400">✓</div>
            <div className="ml-3 text-sm text-green-700">{successMessage}</div>
          </div>
        </div>
      )}

      {/* Admin Setup */}
      <AdminSetup onConfigChange={handleConfigSave} initialConfig={adminConfig || undefined} />

      {/* Action Buttons */}
      {adminConfig && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Actions</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setShowLeasingForm(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-lg font-medium text-gray-900">Create Leasing</div>
                <div className="text-sm text-gray-500 text-center mt-1">
                  Create new leasing with images and details
                </div>
              </button>

              <button
                onClick={() => setShowCampaignForm(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <div className="text-3xl mb-2">📊</div>
                <div className="text-lg font-medium text-gray-900">Create Campaign</div>
                <div className="text-sm text-gray-500 text-center mt-1">
                  Create campaign linked to existing leasing
                </div>
              </button>

              <button
                onClick={() => setShowFinalizeCampaignForm(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors"
              >
                <div className="text-3xl mb-2">✅</div>
                <div className="text-lg font-medium text-gray-900">Finalize Campaign</div>
                <div className="text-sm text-gray-500 text-center mt-1">
                  Finalize an existing campaign
                </div>
              </button>

              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <div className="text-3xl mb-2">💳</div>
                <div className="text-lg font-medium text-gray-900">Create Payment</div>
                <div className="text-sm text-gray-500 text-center mt-1">
                  Create payment for leasing agreement
                </div>
              </button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Quick Guide:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• First configure your API settings above (including Admin User ID)</li>
                <li>• Create leasings with required images (Leasing.Cover.png, Leasing.Miniature.png)</li>
                <li>• Create campaigns that reference existing leasings</li>
                <li>• Create payments for existing user leasing agreements</li>
                <li>• All operations use the configured headers automatically</li>
                <li>• File uploads use the Admin User ID as the entity ID</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {!adminConfig && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="text-blue-400">ℹ️</div>
            <div className="ml-3 text-sm text-blue-700">
              Please configure your admin settings above to start managing leasings and campaigns.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
