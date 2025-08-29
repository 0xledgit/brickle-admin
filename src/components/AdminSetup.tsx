'use client';

import { useState } from 'react';
import { AdminConfig } from '@/lib/types';

interface AdminSetupProps {
  onConfigChange: (config: AdminConfig) => void;
  initialConfig?: AdminConfig;
}

export default function AdminSetup({ onConfigChange, initialConfig }: AdminSetupProps) {
  const [config, setConfig] = useState<AdminConfig>(
    initialConfig || {
      apiKey: '',
      ownerEmail: '',
      baseUrl: 'https://localhost:7001', // Default API URL
      adminUserId: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigChange(config);
  };

  const handleChange = (field: keyof AdminConfig, value: string) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Configuration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-2">
            API Base URL
          </label>
          <input
            type="text"
            id="baseUrl"
            value={config.baseUrl}
            onChange={(e) => handleChange('baseUrl', e.target.value)}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://localhost:7001"
            required
          />
        </div>

        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={config.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your API key"
            required
          />
        </div>

        <div>
          <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Owner Email
          </label>
          <input
            type="email"
            id="ownerEmail"
            value={config.ownerEmail}
            onChange={(e) => handleChange('ownerEmail', e.target.value)}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="owner@example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="adminUserId" className="block text-sm font-medium text-gray-700 mb-2">
            Admin User ID
          </label>
          <input
            type="text"
            id="adminUserId"
            value={config.adminUserId}
            onChange={(e) => handleChange('adminUserId', e.target.value)}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter admin user ID for file uploads"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This ID will be used as the entity ID for file uploads
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Configuration
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Note:</strong> Headers are auto-generated:</p>
        <ul className="mt-1 ml-4">
          <li>• <code>correlationId</code>: Auto-generated UUID</li>
          <li>• <code>source</code>: &quot;brickle-admin&quot;</li>
          <li>• <code>requestDate</code>: Current timestamp</li>
        </ul>
        <p className="mt-2"><strong>File Upload:</strong> Admin User ID is used as entity ID for all file uploads</p>
      </div>
    </div>
  );
}