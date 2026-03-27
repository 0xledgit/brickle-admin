'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { AdminConfig } from '@/lib/types';

const DEFAULT_BASE_TOKEN = '0x58845DC7223e1D84D42d0E6fa849620124d537ad';
const BRICKLE_ADDRESS = '0xB818f59e7D46b5F17CfE66ef42cd01155a052e7C';
const RPC_URL = 'https://polygon-amoy.drpc.org';

const ERC20_MINT_ABI = [
  'function mint(address to, uint256 amount)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
];

interface BrickleRechargeFormProps {
  adminConfig: AdminConfig;
  onSuccess: () => void;
  onCancel: () => void;
}

type RechargeMethod = 'mint' | 'transfer';

export default function BrickleRechargeForm({ adminConfig, onSuccess, onCancel }: BrickleRechargeFormProps) {
  const [baseTokenAddress, setBaseTokenAddress] = useState(DEFAULT_BASE_TOKEN);
  const [brickleAddress, setBrickleAddress] = useState(BRICKLE_ADDRESS);
  const [amount, setAmount] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [method, setMethod] = useState<RechargeMethod>('mint');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privateKey) {
      setError('Ingresa la private key');
      return;
    }

    if (!amount) {
      setError('Ingresa un monto válido');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = new ethers.Wallet(privateKey, provider);
      const token = new ethers.Contract(baseTokenAddress, ERC20_MINT_ABI, signer);

      // Aceptar monto raw (como en cast) o con decimales (ej. "1000" = 1000 tokens)
      const amountWei = amount.includes('.')
        ? ethers.parseUnits(amount, 18)
        : ethers.getBigInt(amount);

      if (amountWei <= BigInt(0)) {
        setError('El monto debe ser mayor a 0');
        setLoading(false);
        return;
      }

      if (method === 'mint') {
        const tx = await token.mint(brickleAddress, amountWei);
        await tx.wait();
      } else {
        const tx = await token.transfer(brickleAddress, amountWei);
        await tx.wait();
      }

      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Recargar cuenta Brickle</h1>
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
            Cancelar
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Envía base token a la cuenta Brickle usando mint o transfer. La private key debe tener permisos de minter o saldo suficiente.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as RechargeMethod)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            >
              <option value="mint">Mint (requiere rol minter)</option>
              <option value="transfer">Transfer (requiere saldo en wallet)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Token (contrato)</label>
            <input
              type="text"
              value={baseTokenAddress}
              onChange={(e) => setBaseTokenAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Brickle (destino)</label>
            <input
              type="text"
              value={brickleAddress}
              onChange={(e) => setBrickleAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (en unidades, ej. 1000000)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              placeholder="100000000000000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Raw: 100000000000000 = 0.0001 tokens. Con decimales: 1000.5 = 1000.5 tokens
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Private Key</label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              placeholder="0x..."
            />
            <p className="text-xs text-gray-500 mt-1">Wallet con rol minter (mint) o con saldo (transfer)</p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : method === 'mint' ? 'Mint' : 'Transfer'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-md text-xs text-gray-600 font-mono">
          <strong>Comando cast equivalente (mint):</strong>
          <pre className="mt-2 overflow-x-auto">
            {`cast send ${baseTokenAddress} "mint(address,uint256)" ${brickleAddress} ${amount || 'AMOUNT'} --rpc-url ${RPC_URL} --private-key INPUT_PRIVATE_KEY`}
          </pre>
        </div>
      </div>
    </div>
  );
}
