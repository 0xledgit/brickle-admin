'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { AdminConfig, LeasingDto, UserLeasingAgreementDto, CreatePaymentDto, PermitSignature } from '@/lib/types';
import { BrickleAPI } from '@/lib/api';

const LEASING_CORE_ABI = [
  "function leasingFinance() view returns (uint256 residualValue, uint256 annualInsurance, uint256 holdersPct, uint256 buyerInterest, uint256 brickleInterest, uint256 principal, uint256 totalMonthlyPayment, uint256 monthlyRateBuyer)",
];

interface PaymentFormProps {
  adminConfig: AdminConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (payment: any) => void;
  onCancel: () => void;
}

type PaymentType = 'suggested' | 'custom';

export default function PaymentForm({ adminConfig, onSuccess, onCancel }: PaymentFormProps) {
  const [leasings, setLeasings] = useState<LeasingDto[]>([]);
  const [selectedLeasingId, setSelectedLeasingId] = useState<string>('');
  const [agreements, setAgreements] = useState<UserLeasingAgreementDto[]>([]);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>('');

  const [paymentType, setPaymentType] = useState<PaymentType>('suggested');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [suggestedAmount, setSuggestedAmount] = useState<string>('0');

  const [deadline, setDeadline] = useState<number>(Math.floor(Date.now() / 1000) + 3600);
  const [permitSignature, setPermitSignature] = useState<PermitSignature>({
    v: 0,
    r: '',
    s: ''
  });
  const [privateKey, setPrivateKey] = useState<string>('');

  // Hardcoded blockchain configuration values (MockERC20, Paymaster)
  const tokenAddress = '0x2860033D39A9f4788D74763C4E9cEBCDd5addD17';
  const paymasterAddress = '0xd1E6F94cC73f9B13953a49C669cEf06755AB8544';
  // const userAddress = '0x4Ac2bb44F3a89B13A1E9ce30aBd919c40CbA4385'; // Commented out as it's unused but kept for reference
  const relayerFee = '100000';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [loadingLeasings, setLoadingLeasings] = useState(false);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [fetchingContract, setFetchingContract] = useState(false);
  const [generatingPermit, setGeneratingPermit] = useState(false);

  const api = useMemo(() => new BrickleAPI(adminConfig), [adminConfig]);

  const loadLeasings = useCallback(async () => {
    try {
      setLoadingLeasings(true);
      const data = await api.getAllLeasings();
      setLeasings(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leasings';
      setError(`Failed to load leasings: ${errorMessage}`);
    } finally {
      setLoadingLeasings(false);
    }
  }, [api]);

  useEffect(() => {
    loadLeasings();
  }, [loadLeasings]);

  const loadAgreements = useCallback(async () => {
    if (!selectedLeasingId) return;
    try {
      setLoadingAgreements(true);
      setError('');
      const data = await api.getUserLeasingAgreementsByLeasingId(selectedLeasingId);

      let agreementsArray: UserLeasingAgreementDto[] = [];
      if (Array.isArray(data)) {
        agreementsArray = data;
      } else if (data && typeof data === 'object' && 'id' in data) {
        agreementsArray = [data as UserLeasingAgreementDto];
      }

      setAgreements(agreementsArray);

      if (agreementsArray.length === 0) {
        setError('No user leasing agreements found for this leasing.');
      }
    } catch (err) {
      console.error('Error loading agreements:', err);
      setError('Failed to load agreements');
      setAgreements([]);
    } finally {
      setLoadingAgreements(false);
    }
  }, [api, selectedLeasingId]);

  useEffect(() => {
    if (selectedLeasingId) {
      setError('');
      setAgreements([]);
      loadAgreements();
    } else {
      setAgreements([]);
      setSelectedAgreementId('');
      setError('');
    }
  }, [selectedLeasingId, loadAgreements]);

  const loadContractData = useCallback(async () => {
    const agreement = agreements.find(a => a.id === selectedAgreementId);
    if (!agreement?.leasingCoreAddress) return;

    try {
      setFetchingContract(true);
      // Use Alchemy provider as in other parts
      const provider = new ethers.JsonRpcProvider(
        "https://polygon-amoy.g.alchemy.com/v2/zetnkpwznZk_YH-8UAoij"
      );

      const leasingContract = new ethers.Contract(
        agreement.leasingCoreAddress,
        LEASING_CORE_ABI,
        provider
      );

      const finance = await leasingContract.leasingFinance();
      // finance.totalMonthlyPayment is a BigInt
      const amount = finance.totalMonthlyPayment.toString();

      setSuggestedAmount(amount);
      if (paymentType === 'suggested') {
        setPaymentAmount(amount);
      }
    } catch (err) {
      console.error('Failed to read contract:', err);
      // Fallback or error warning? defaulting to 0 allows manual entry
      setSuggestedAmount('0');
    } finally {
      setFetchingContract(false);
    }
  }, [agreements, selectedAgreementId, paymentType]);

  useEffect(() => {
    if (selectedAgreementId) {
      loadContractData();
    }
  }, [selectedAgreementId, loadContractData]);

  // Update payment amount when type changes or suggested amount loads
  useEffect(() => {
    if (paymentType === 'suggested') {
      setPaymentAmount(suggestedAmount);
    }
  }, [paymentType, suggestedAmount]);

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
      const signerAddress = await signer.getAddress(); // Renamed from userAddress to avoid conflict

      const token = new ethers.Contract(
        tokenAddress,
        [
          "function nonces(address) view returns (uint256)",
          "function name() view returns (string)",
          "function DOMAIN_SEPARATOR() view returns (bytes32)",
        ],
        provider
      );

      const name = await token.name();
      const version = "1";
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      const nonce = await token.nonces(signerAddress);
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
        owner: signerAddress,
        spender: paymasterAddress,
        value: totalPermitAmount,
        nonce: nonce,
        deadline: newDeadline,
      };

      const signature = await signer.signTypedData(domain, types, message);
      const { v, r, s } = ethers.Signature.from(signature);

      setPermitSignature({ v, r, s });
      setDeadline(newDeadline);

    } catch (err: unknown) {
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
      setError('Please sign the transaction first');
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to create payment: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedAgreement = agreements.find(a => a.id === selectedAgreementId);
  const isPermitSigned = permitSignature.r !== '' && permitSignature.s !== '';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Payment</h1>
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
            Cancel
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leasing Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Leasing *</label>
            <select
              value={selectedLeasingId}
              onChange={(e) => setSelectedLeasingId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              disabled={loadingLeasings}
              required
            >
              <option value="">{loadingLeasings ? 'Loading...' : 'Select a leasing'}</option>
              {leasings.map((l) => (
                <option key={l.id} value={l.id}>{l.name} - ${l.price.toLocaleString()}</option>
              ))}
            </select>
          </div>

          {/* Agreement Selection */}
          {selectedLeasingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User Leasing Agreement *</label>
              <select
                value={selectedAgreementId}
                onChange={(e) => setSelectedAgreementId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                disabled={loadingAgreements}
                required
              >
                <option value="">{loadingAgreements ? 'Loading...' : agreements.length === 0 ? 'No agreements found' : 'Select an agreement'}</option>
                {agreements.map((a) => (
                  <option key={a.id} value={a.id}>
                    Agreement {a.id.substring(0, 8)} - ${a.assetValue?.toLocaleString() || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedAgreement && (
            <>
              {/* Payment Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-md text-gray-900"
                  >
                    <option value="suggested">Suggested Monthly Payment</option>
                    <option value="custom">Custom Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount {paymentType === 'suggested' && '(Auto-fetched)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => {
                        setPaymentType('custom');
                        setPaymentAmount(e.target.value);
                      }}
                      className={`w-full px-3 py-2 border rounded-md text-gray-900 ${paymentType === 'suggested' ? 'bg-gray-100' : 'bg-white border-gray-300'
                        }`}
                      placeholder="Amount"
                      readOnly={paymentType === 'suggested' && fetchingContract}
                    />
                    {fetchingContract && (
                      <span className="absolute right-3 top-2 text-xs text-blue-500">Fetching...</span>
                    )}
                  </div>
                </div>
              </div>

              {paymentType === 'suggested' && (
                <p className="text-xs text-gray-500">
                  This amount is read directly from the smart contract ({selectedAgreement.leasingCoreAddress}).
                </p>
              )}

              {/* Signing Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authorization</h3>

                <div className="bg-gray-50 p-4 rounded-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Private Key (for signing)</label>
                    <input
                      type="password"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      placeholder="Enter private key to sign permit"
                    />
                    <p className="text-xs text-gray-500 mt-1">This key is used locally to generate the permit signature.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={generatePermit}
                      disabled={generatingPermit || !privateKey || !paymentAmount || isPermitSigned}
                      className={`px-4 py-2 rounded-md text-white font-medium ${isPermitSigned
                        ? 'bg-green-500 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                      {generatingPermit ? 'Signing...' : isPermitSigned ? '✓ Signed Successfully' : 'Sign Permit'}
                    </button>

                    {isPermitSigned && (
                      <span className="text-sm text-green-700 font-medium px-3 py-1 bg-green-100 rounded-full">
                        Ready to Submit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading || !isPermitSigned}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing Payment...' : 'Submit Payment'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}