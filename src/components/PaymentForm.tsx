'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { AdminConfig, LeasingDto, UserLeasingAgreementDto, CreatePaymentDto, PermitSignature } from '@/lib/types';
import { BrickleAPI } from '@/lib/api';

const LEASING_CORE_ABI = [
  "function leasingFinance() view returns (uint256 residualValue, uint256 annualInsurance, uint256 holdersPct, uint256 buyerInterest, uint256 brickleInterest, uint256 principal, uint256 totalMonthlyPayment, uint256 monthlyRateBuyer)",
  "function currentMonth() view returns (uint256)",
  "function lastPaymentMade() view returns (bool)",
  "function leasingInfo() view returns (tuple(uint256 assetValue, uint256 usefulLife, uint256 termMonths, uint256 leasingTokenPrice, uint256 monthlyRate, uint256 monthlyPayment, uint256 managementFee, uint256 insurancePct, uint256 ibrRate, uint256 riskLevel, uint256 riskRate, uint256 IVA, uint256 reteIcaPct, uint256 reteFuentePct, uint256 finalPaymentAmount, uint256 buyerRetentionPercentage))",
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
  const [verifyByAddressResult, setVerifyByAddressResult] = useState<{
    residualValue?: string;
    finalPaymentAmount?: string;
    expectedAmount?: string;
    currentMonth?: number;
    termMonths?: number;
    isResidualPayment?: boolean;
    lastPaymentMade?: boolean;
  } | null>(null);
  const [contractState, setContractState] = useState<{
    currentMonth: number;
    termMonths: number;
    isResidualPayment: boolean;
    lastPaymentMade: boolean;
    residualValue?: string;
    finalPaymentAmount?: string;
  } | null>(null);

  const [deadline, setDeadline] = useState<number>(Math.floor(Date.now() / 1000) + 3600);
  const [permitSignature, setPermitSignature] = useState<PermitSignature>({
    v: 0,
    r: '',
    s: ''
  });
  const [signerAddress, setSignerAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');

  // Hardcoded blockchain configuration values (Paymaster)
  const DEFAULT_BASE_TOKEN = '0xe0Edb9aa507b3AbAd4e5aB2d39AfbC651Cce16d6';
  const paymasterAddress = '0xe635935F30083CEc31E716e1fc30e7E5f252f70C';
  // Usar baseToken del acuerdo si está disponible (debe coincidir con el LeasingCore)
  const selectedAgreementForToken = agreements.find(a => a.id === selectedAgreementId);
  const tokenAddress = selectedAgreementForToken?.baseToken ?? DEFAULT_BASE_TOKEN;
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

  const loadContractStateByAddress = useCallback(async (leasingCoreAddress: string) => {
    try {
      setFetchingContract(true);
      setError('');
      setVerifyByAddressResult(null);
      const apiState = await api.getLeasingStateByAddress(leasingCoreAddress);
      setVerifyByAddressResult({
        residualValue: apiState.residualValue,
        finalPaymentAmount: apiState.finalPaymentAmount,
        expectedAmount: apiState.expectedAmount,
        currentMonth: apiState.currentMonth,
        termMonths: apiState.termMonths,
        isResidualPayment: apiState.isResidualPayment,
        lastPaymentMade: apiState.lastPaymentMade,
      });
    } catch (err) {
      console.error('Failed to load state by address:', err);
      setError('No se pudo cargar el estado del contrato. Verifique la dirección y que la API esté disponible.');
    } finally {
      setFetchingContract(false);
    }
  }, [api]);

  const loadContractData = useCallback(async () => {
    const agreement = agreements.find(a => a.id === selectedAgreementId);
    if (!agreement?.leasingCoreAddress) {
      setSuggestedAmount('0');
      setContractState(null);
      return;
    }

    try {
      setFetchingContract(true);
      setContractState(null);

      // Prioridad: API que devuelve estado completo (currentMonth, termMonths, isResidualPayment)
      try {
        const apiState = await api.getExpectedPaymentAmount(selectedAgreementId);
        if (apiState.expectedAmount && apiState.expectedAmount !== '0') {
          setSuggestedAmount(apiState.expectedAmount);
          if (paymentType === 'suggested') {
            setPaymentAmount(apiState.expectedAmount);
          }
          if (apiState.currentMonth !== undefined && apiState.termMonths !== undefined) {
            setContractState({
              currentMonth: apiState.currentMonth,
              termMonths: apiState.termMonths,
              isResidualPayment: apiState.isResidualPayment ?? false,
              lastPaymentMade: apiState.lastPaymentMade ?? false,
              residualValue: apiState.residualValue,
              finalPaymentAmount: apiState.finalPaymentAmount,
            });
          }
          return;
        }
        if (apiState.lastPaymentMade) {
          setContractState({
            currentMonth: apiState.currentMonth ?? 0,
            termMonths: apiState.termMonths ?? 0,
            isResidualPayment: false,
            lastPaymentMade: true,
          });
          setSuggestedAmount('0');
          return;
        }
      } catch (apiErr) {
        console.warn('API state failed, trying contract:', apiErr);
      }

      // Fallback: leer directamente del contrato
      const provider = new ethers.JsonRpcProvider(
        "https://polygon-amoy.g.alchemy.com/v2/zetnkpwznZk_YH-8UAoij"
      );
      const leasingContract = new ethers.Contract(
        agreement.leasingCoreAddress,
        LEASING_CORE_ABI,
        provider
      );

      const [finance, currentMonth, lastPaymentMade, leasingInfo] = await Promise.all([
        leasingContract.leasingFinance(),
        leasingContract.currentMonth(),
        leasingContract.lastPaymentMade(),
        leasingContract.leasingInfo(),
      ]);

      const termMonths = Number(leasingInfo.termMonths);
      const currentMonthNum = Number(currentMonth);
      const isResidual = lastPaymentMade === false && currentMonthNum >= termMonths && Number(finance.residualValue) > 0;
      const amount = isResidual ? finance.residualValue.toString() : finance.totalMonthlyPayment.toString();

      setSuggestedAmount(amount);
      if (paymentType === 'suggested') {
        setPaymentAmount(amount);
      }
      setContractState({
        currentMonth: currentMonthNum,
        termMonths,
        isResidualPayment: isResidual,
        lastPaymentMade: Boolean(lastPaymentMade),
        residualValue: isResidual ? finance.residualValue.toString() : undefined,
        finalPaymentAmount: isResidual ? leasingInfo.finalPaymentAmount.toString() : undefined,
      });
    } catch (err) {
      console.error('Failed to read contract:', err);
      setSuggestedAmount('0');
      setContractState(null);
    } finally {
      setFetchingContract(false);
    }
  }, [agreements, selectedAgreementId, paymentType, api]);

  useEffect(() => {
    if (selectedAgreementId) {
      loadContractData();
    }
  }, [selectedAgreementId, loadContractData]);

  // Limpiar permit al cambiar acuerdo (el token puede ser distinto)
  useEffect(() => {
    setPermitSignature({ v: 0, r: '', s: '' });
    setSignerAddress('');
  }, [selectedAgreementId]);

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
      setSignerAddress(signerAddress); // Wallet que firmó el permit - debe coincidir con sender en API
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

    if (contractState?.isResidualPayment) {
      try {
        setLoading(true);
        setError('');
        const result = await api.finalizeResidualPayment({
          userLeasingAgreementId: selectedAgreementId,
        });
        onSuccess(result);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`No se pudo ejecutar el pago residual: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
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
        permitSignature,
        sender: signerAddress || undefined
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
  const needsPermit = contractState?.isResidualPayment !== true;
  const submitDisabled =
    loading ||
    !selectedAgreementId ||
    Boolean(contractState?.lastPaymentMade) ||
    fetchingContract ||
    (needsPermit && !isPermitSigned);

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

          {/* Verificación por dirección de LeasingCore (útil para debugging) */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-700 mb-2">Verificar estado por dirección de contrato</h3>
            <p className="text-xs text-gray-500 mb-2">Ingrese la dirección del LeasingCore (ej. 0x96a0a0f96785e804ec9d5134e16afa7e4ced2670) para consultar residualValue y finalPaymentAmount directamente del contrato.</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0x96a0a0f96785e804ec9d5134e16afa7e4ced2670"
                id="leasing-core-verify"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = document.getElementById('leasing-core-verify') as HTMLInputElement;
                    const addr = input?.value?.trim();
                    if (addr?.startsWith('0x')) loadContractStateByAddress(addr);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('leasing-core-verify') as HTMLInputElement;
                  const addr = input?.value?.trim();
                  if (addr?.startsWith('0x')) loadContractStateByAddress(addr);
                }}
                disabled={fetchingContract}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm disabled:opacity-50"
              >
                {fetchingContract ? 'Cargando...' : 'Verificar'}
              </button>
            </div>
            {verifyByAddressResult && (
              <div className="mt-3 p-3 bg-white rounded border border-gray-200 text-sm space-y-1">
                <p><strong>residualValue (leasingFinance):</strong> {verifyByAddressResult.residualValue ?? '—'}</p>
                <p><strong>finalPaymentAmount (leasingInfo):</strong> {verifyByAddressResult.finalPaymentAmount ?? '—'}</p>
                <p><strong>Monto a pagar (expectedAmount):</strong> {verifyByAddressResult.expectedAmount ?? '—'}</p>
                <p><strong>Estado:</strong> Cuota {verifyByAddressResult.currentMonth ?? '—'} de {verifyByAddressResult.termMonths ?? '—'}, último pago: {verifyByAddressResult.lastPaymentMade ? 'Sí' : 'No'}</p>
              </div>
            )}
          </div>

          {selectedAgreement && (
            <>
              {/* Contract State - currentMonth, termMonths, residual */}
              {contractState && (
                <div className={`rounded-lg p-4 mb-4 ${
                  contractState.lastPaymentMade
                    ? 'bg-green-50 border border-green-200'
                    : contractState.isResidualPayment
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-blue-50 border border-blue-200'
                }`}>
                  <h3 className="font-medium text-gray-900 mb-2">Estado del contrato LeasingCore</h3>
                  {contractState.lastPaymentMade ? (
                    <p className="text-green-800">✓ Todos los pagos completados (incluido valor residual). No hay más pagos pendientes.</p>
                  ) : contractState.isResidualPayment ? (
                    <div className="text-amber-800 space-y-2">
                      <p>
                        <strong>Pago residual pendiente:</strong> Cuota {contractState.currentMonth} de {contractState.termMonths}.
                        Ejecute <strong>makeLastLeasingPayment</strong> con el valor residual.
                      </p>
                      <div className="mt-2 pt-2 border-t border-amber-200 text-sm space-y-1">
                        <p><strong>Valor residual (a pagar):</strong> {contractState.residualValue ?? '—'} <span className="text-amber-700">(leasingFinance.residualValue)</span></p>
                        <p><strong>Final payment amount (incentivo):</strong> {contractState.finalPaymentAmount ?? '—'} <span className="text-amber-700">(leasingInfo.finalPaymentAmount)</span></p>
                        <p className="text-amber-900 mt-1">
                          Tras <strong>makeLastLeasingPayment</strong>, el contrato acumula <strong>residualValue + finalPaymentAmount</strong> en el saldo reclamable de cada tokenholder (igual que las cuotas). El argumento <code className="text-xs">amount</code> debe ser exactamente <strong>residualValue</strong>. <code className="text-xs">clientAddress</code> es referencia para la API, sin transfer on-chain de ese cierre.
                        </p>
                        <p className="text-amber-900">
                          En la app, «Valor por reclamar» debe mostrar la suma del cierre hasta que reclamen (mismo botón que las cuotas).
                        </p>
                        {contractState.residualValue === contractState.finalPaymentAmount && (
                          <p className="text-amber-800 italic mt-1">Cuando finalPaymentAmount fue configurado en la campaña, el contrato usa ese valor para ambos. Por eso pueden coincidir.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-blue-800">
                      Cuota {contractState.currentMonth + 1} de {contractState.termMonths} (cuota mensual)
                    </p>
                  )}
                </div>
              )}

              {/* Payment Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-md text-gray-900"
                    disabled={contractState?.lastPaymentMade}
                  >
                    <option value="suggested">
                      {contractState?.isResidualPayment ? 'Pago residual (última cuota)' : 'Suggested Monthly Payment'}
                    </option>
                    <option value="custom">Custom Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {contractState?.isResidualPayment ? 'Valor residual (a pagar - makeLastLeasingPayment)' : 'Payment Amount'} {paymentType === 'suggested' && '(Auto-fetched)'}
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
                  {contractState?.isResidualPayment
                    ? 'Valor residual del contrato. Al enviar, la API firma en servidor (WalletPrivateKey) para gas; el LeasingCore acredita residual + incentivo final a inversores para reclamar. No se usa permit ni Paymaster en el navegador.'
                    : `This amount is read directly from the smart contract (${selectedAgreement.leasingCoreAddress}).`}
                </p>
              )}

              {contractState?.lastPaymentMade && (
                <p className="text-sm text-amber-600 font-medium">
                  El formulario está deshabilitado: no hay pagos pendientes.
                </p>
              )}

              {/* Signing Section (solo cuotas mensuales; residual firma el backend) */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authorization</h3>

                {contractState?.isResidualPayment ? (
                  <div className="bg-sky-50 border border-sky-200 p-4 rounded-md text-sm text-sky-900 space-y-2">
                    <p className="font-medium">Pago residual</p>
                    <p>
                      No introduzca private key aquí (riesgo de seguridad). La API ejecuta <code className="text-xs bg-sky-100 px-1 rounded">POST /api/Payment/finalize-residual</code> usando <code className="text-xs bg-sky-100 px-1 rounded">Web3Settings:WalletPrivateKey</code> en el servidor (wallet de operaciones con gas nativo).
                    </p>
                    <p>
                      Esa firma cubre <strong>gas</strong>. El contrato acumula <strong>residual + incentivo final</strong> para tokenholders; lo reclaman en la app igual que cada cuota.
                    </p>
                  </div>
                ) : (
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
                        disabled={generatingPermit || !privateKey || !paymentAmount || isPermitSigned || contractState?.lastPaymentMade}
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
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitDisabled}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (contractState?.isResidualPayment ? 'Procesando pago residual...' : 'Processing Payment...')
                    : contractState?.isResidualPayment
                      ? 'Ejecutar makeLastLeasingPayment'
                      : 'Submit Payment'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}