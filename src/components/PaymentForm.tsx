'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AdminConfig, LeasingDto, UserLeasingAgreementDto, CreatePaymentDto, PermitSignature } from '@/lib/types';
import { BrickleAPI } from '@/lib/api';

interface PaymentFormProps {
  adminConfig: AdminConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (payment: any) => void;
  onCancel: () => void;
}

export default function PaymentForm({ adminConfig, onSuccess, onCancel }: PaymentFormProps) {
  const [leasings, setLeasings] = useState<LeasingDto[]>([]);
  const [selectedLeasingId, setSelectedLeasingId] = useState<string>('');
  const [agreements, setAgreements] = useState<UserLeasingAgreementDto[]>([]);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [deadline, setDeadline] = useState<number>(Math.floor(Date.now() / 1000) + 3600);
  const [permitSignature, setPermitSignature] = useState<PermitSignature>({
    v: 0,
    r: '',
    s: ''
  });
  const [privateKey, setPrivateKey] = useState<string>('');
  // Hardcoded blockchain configuration values
  const tokenAddress = '0x7Bb635cA8ef817402A30BCb0EbC461765aCdf51B';
  const paymasterAddress = '0x2Df87c5Cd5Bc60271FfAc5C1eF1DBdaB89AaB49F';
  const userAddress = '0x4Ac2bb44F3a89B13A1E9ce30aBd919c40CbA4385';
  const relayerFee = '100000';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [loadingLeasings, setLoadingLeasings] = useState(false);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [generatingPermit, setGeneratingPermit] = useState(false);

  const api = new BrickleAPI(adminConfig);

  useEffect(() => {
    loadLeasings();
  }, []);

  useEffect(() => {
    if (selectedLeasingId) {
      setError(''); // Clear any previous errors
      setAgreements([]); // Clear previous agreements while loading
      loadAgreements();
    } else {
      setAgreements([]);
      setSelectedAgreementId('');
      setError(''); // Clear error when no leasing selected
    }
  }, [selectedLeasingId]);

  // Auto-generate permit when payment amount and private key are available
  useEffect(() => {
    if (paymentAmount && privateKey && !permitSignature.r && !generatingPermit) {
      generatePermit();
    }
  }, [paymentAmount, privateKey]);

  const loadLeasings = async () => {
    try {
      setLoadingLeasings(true);
      const data = await api.getAllLeasings();
      setLeasings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leasings';
      setError(`Failed to load leasings: ${errorMessage}`);
    } finally {
      setLoadingLeasings(false);
    }
  };

  const loadAgreements = async () => {
    if (!selectedLeasingId) return;

    console.log('🔍 Loading agreements for leasing ID:', selectedLeasingId);

    try {
      setLoadingAgreements(true);
      setError(''); // Clear any previous errors
      const data = await api.getUserLeasingAgreementsByLeasingId(selectedLeasingId);

      let agreementsArray: UserLeasingAgreementDto[] = [];

      if (Array.isArray(data)) {
        agreementsArray = data;
      } else if (data && typeof data === 'object' && 'id' in data) {
        // Single agreement object returned
        agreementsArray = [data as UserLeasingAgreementDto];
      } else if (data === null || data === undefined) {
        agreementsArray = [];
      } else {
        agreementsArray = [];
      }

      setAgreements(agreementsArray);

      if (agreementsArray.length === 0) {
        setError('No user leasing agreements found for this leasing. Users may need to create agreements first.');
      }
    } catch (err) {
      console.error('❌ Error loading agreements:', err);

      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
      }

      // Enhanced error message based on error type
      let errorMessage = 'Failed to load agreements';
      if (err instanceof Error) {
        if (err.message.includes('404')) {
          errorMessage = 'Agreements endpoint not found. The API may not be available.';
        } else if (err.message.includes('401')) {
          errorMessage = 'Unauthorized access. Please check your admin configuration.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = `API Error: ${err.message}`;
        }
      }

      setError(errorMessage);
      setAgreements([]); // Reset to empty array on error
    } finally {
      setLoadingAgreements(false);
    }
  };

  const generatePermit = async () => {
    if (!privateKey || !paymentAmount) {
      setError('Please provide private key and payment amount first');
      return;
    }

    try {
      setGeneratingPermit(true);
      setError('');

      const provider = new ethers.JsonRpcProvider(
        "https://polygon-amoy.g.alchemy.com/v2/zetnkpwznZk_YH-8UAoij"
      );
      const signer = new ethers.Wallet(privateKey, provider);

      const token = new ethers.Contract(
        tokenAddress,
        [
          "function nonces(address) view returns (uint256)",
          "function name() view returns (string)",
          "function version() view returns (string)",
          "function DOMAIN_SEPARATOR() view returns (bytes32)",
        ],
        provider
      );

      const name = await token.name();
      const version = "1";
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      const nonce = await token.nonces(userAddress);
      const newDeadline = Math.floor(Date.now() / 1000) + 3600;

      const campaignCommitment = ethers.getBigInt(paymentAmount);
      const relayerFeeAmount = ethers.getBigInt(relayerFee);
      const totalPermitAmount = campaignCommitment + relayerFeeAmount;

      const domain = {
        name,
        version,
        chainId: Number(chainId),
        verifyingContract: tokenAddress,
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = {
        owner: userAddress,
        spender: paymasterAddress,
        value: totalPermitAmount,
        nonce: nonce,
        deadline: newDeadline,
      };

      const signature = await signer.signTypedData(domain, types, message);
      const { v, r, s } = ethers.Signature.from(signature);

      setPermitSignature({ v, r, s });
      setDeadline(newDeadline);

      console.log('Permit generated successfully:', { v, r, s, deadline: newDeadline });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate permit';
      setError(`Failed to generate permit: ${errorMessage}`);
    } finally {
      setGeneratingPermit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAgreementId) {
      setError('Please select a leasing agreement');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (!permitSignature.r || !permitSignature.s) {
      setError('Please provide a valid permit signature');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payment: CreatePaymentDto = {
        userLeasingAgreementId: selectedAgreementId,
        paymentAmount,
        deadline,
        permitSignature
      };

      const result = await api.createPayment(payment);
      onSuccess(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to create payment: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedAgreement = agreements && Array.isArray(agreements)
    ? agreements.find(a => a.id === selectedAgreementId)
    : undefined;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Payment</h1>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="text-red-400">⚠</div>
              <div className="ml-3 text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leasing Selection */}
          <div>
            <label htmlFor="leasing" className="block text-sm font-medium text-gray-700 mb-2">
              Select Leasing *
            </label>
            <select
              id="leasing"
              value={selectedLeasingId}
              onChange={(e) => setSelectedLeasingId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              disabled={loadingLeasings}
              required
            >
              <option value="">
                {loadingLeasings ? 'Loading leasings...' : 'Select a leasing'}
              </option>
              {leasings.map((leasing) => (
                <option key={leasing.id} value={leasing.id}>
                  {leasing.name} - ${leasing.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* DEBUG: Agreement State Info */}
          {selectedLeasingId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <h4 className="text-xs font-semibold text-yellow-800 mb-1">🐛 Debug Info</h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>Selected Leasing ID: <code>{selectedLeasingId}</code></div>
                <div>Loading Agreements: <code>{loadingAgreements.toString()}</code></div>
                <div>Agreements Array: <code>{Array.isArray(agreements).toString()}</code></div>
                <div>Agreements Length: <code>{agreements?.length || 0}</code></div>
                <div>Agreements Type: <code>{typeof agreements}</code></div>
                <div>First Agreement: <code>{agreements?.[0]?.id ? agreements[0].id.substring(0, 8) + '...' : 'None'}</code></div>
              </div>
            </div>
          )}

          {/* Agreement Selection */}
          {selectedLeasingId && (
            <div>
              <label htmlFor="agreement" className="block text-sm font-medium text-gray-700 mb-2">
                Select User Leasing Agreement *
                {!loadingAgreements && Array.isArray(agreements) && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({agreements.length} found)
                  </span>
                )}
              </label>
              <select
                id="agreement"
                value={selectedAgreementId}
                onChange={(e) => setSelectedAgreementId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                disabled={loadingAgreements}
                required
              >
                <option value="">
                  {loadingAgreements ? 'Loading agreements...' :
                    agreements.length === 0 ? 'No agreements found' : 'Select an agreement'}
                </option>
                {Array.isArray(agreements) && agreements.length > 0 ? agreements.map((agreement) => {
                  console.log('🔧 Rendering agreement option:', agreement);
                  return (
                    <option key={agreement.id} value={agreement.id}>
                      Agreement {agreement.id.substring(0, 8)} - ${agreement.assetValue?.toLocaleString() || 'N/A'}
                      ({agreement.tokensPurchased || 0} tokens)
                    </option>
                  );
                }) : null}
              </select>
            </div>
          )}

          {/* Agreement Details */}
          {selectedAgreement && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Agreement Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Asset Value:</span>
                  <span className="ml-2 font-medium text-gray-900">${selectedAgreement.assetValue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tokens Purchased:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedAgreement.tokensPurchased}</span>
                </div>
                <div>
                  <span className="text-gray-600">Term Time:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedAgreement.termTime} months</span>
                </div>
                <div>
                  <span className="text-gray-600">Payment Term:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedAgreement.paymentTerm}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <input
              type="text"
              id="paymentAmount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Enter payment amount (in wei or token units)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the payment amount as a string (e.g., 1000000 for USDC with 6 decimals)
            </p>
          </div>

          {/* Private Key for Permit Generation */}
          <div className="bg-gray-50 p-4 rounded-md space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Permit Generation</h3>

            <div>
              <label htmlFor="privateKey" className="block text-sm text-gray-600 mb-1">
                Private Key * (for signing)
              </label>
              <input
                type="password"
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Private key for signing the permit"
                required
              />
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Warning: This private key is used to sign the permit. Use test keys only.
              </p>
            </div>

            <button
              type="button"
              onClick={generatePermit}
              disabled={generatingPermit || !privateKey || !paymentAmount}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPermit ? 'Generating Permit...' : 'Generate Permit Signature'}
            </button>
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline (Unix Timestamp) *
            </label>
            <input
              type="number"
              id="deadline"
              value={deadline}
              onChange={(e) => setDeadline(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Current value expires in 1 hour: {new Date(deadline * 1000).toLocaleString()}
            </p>
          </div>

          {/* Permit Signature */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Permit Signature *</h3>
              {permitSignature.r && permitSignature.s && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✓ Generated
                </span>
              )}
            </div>

            <div>
              <label htmlFor="permitV" className="block text-sm text-gray-600 mb-1">
                V Value
              </label>
              <input
                type="number"
                id="permitV"
                value={permitSignature.v}
                onChange={(e) => setPermitSignature(prev => ({ ...prev, v: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
                placeholder="27 or 28"
                readOnly={permitSignature.r !== ''}
                required
              />
            </div>

            <div>
              <label htmlFor="permitR" className="block text-sm text-gray-600 mb-1">
                R Value
              </label>
              <input
                type="text"
                id="permitR"
                value={permitSignature.r}
                onChange={(e) => setPermitSignature(prev => ({ ...prev, r: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
                placeholder="0x..."
                readOnly={permitSignature.r !== ''}
                required
              />
            </div>

            <div>
              <label htmlFor="permitS" className="block text-sm text-gray-600 mb-1">
                S Value
              </label>
              <input
                type="text"
                id="permitS"
                value={permitSignature.s}
                onChange={(e) => setPermitSignature(prev => ({ ...prev, s: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
                placeholder="0x..."
                readOnly={permitSignature.s !== ''}
                required
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Use the Generate Permit Signature button above to automatically
                create the permit signature with proper EIP-2612 structure, or manually enter the values.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedAgreementId || !paymentAmount || !permitSignature.r || !permitSignature.s}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Payment...' : 'Create Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}