import React, { useState } from 'react';
import { Plus, Trash2, CircleDollarSign, BadgeCheck, ChevronDown, ChevronUp } from 'lucide-react';

export type Blockchain = 'ethereum' | 'abstract' | 'base';
export interface WalletEntry {
  address: string;
  chain: Blockchain;
}

const chains: { label: string; value: Blockchain; icon: React.ReactNode }[] = [
  { label: 'Ethereum', value: 'ethereum', icon: <CircleDollarSign size={18} /> },
  { label: 'Abstract', value: 'abstract', icon: <BadgeCheck size={18} /> },
  { label: 'Base', value: 'base', icon: <BadgeCheck size={18} /> },
];

function isValidAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function truncateAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-5)}` : '';
}

const WalletManager: React.FC<{
  wallets?: WalletEntry[];
  onChange?: (wallets: WalletEntry[]) => void;
}> = ({ wallets = [], onChange }) => {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<Blockchain>('ethereum');
  const [error, setError] = useState('');
  const [localWallets, setLocalWallets] = useState<WalletEntry[]>(wallets);
  const [collapsed, setCollapsed] = useState(false);

  const handleAdd = () => {
    if (!isValidAddress(address)) {
      setError('Invalid address');
      return;
    }
    if (localWallets.some(w => w.address === address && w.chain === chain)) {
      setError('Wallet already added');
      return;
    }
    const newWallets = [...localWallets, { address, chain }];
    setLocalWallets(newWallets);
    setAddress('');
    setError('');
    if (onChange) onChange(newWallets);
  };

  const handleRemove = (idx: number) => {
    const newWallets = localWallets.filter((_, i) => i !== idx);
    setLocalWallets(newWallets);
    if (onChange) onChange(newWallets);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
      <button
        className="w-full flex items-center justify-between px-6 py-4 focus:outline-none"
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand wallets' : 'Collapse wallets'}
      >
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Wallets</span>
        {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Wallet address (0x...)"
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg w-2/3 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={chain}
              onChange={e => setChain(e.target.value as Blockchain)}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none"
            >
              {chains.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="p-2 bg-blue-500 text-white rounded-lg flex items-center gap-1 hover:bg-blue-600 transition shadow"
            >
              <Plus size={18} /> Add
            </button>
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <ul className="space-y-2">
            {localWallets.map((w, idx) => (
              <li key={w.address + w.chain} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <span className="font-mono text-xs text-gray-800 dark:text-gray-100">
                  {truncateAddress(w.address)}
                </span>
                <span className="text-xs text-gray-500">({w.chain})</span>
                <button
                  onClick={() => handleRemove(idx)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WalletManager;
