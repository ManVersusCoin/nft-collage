// components/CollectionSelector.tsx
import React, { useState, useMemo } from 'react';
import { NFTCollection } from '../hooks/useWalletCollections';
import { BadgeCheck, Search, ChevronDown, ChevronUp, Loader2, RefreshCw, Image, Layout } from 'lucide-react';

interface Props {
    collections: NFTCollection[];
    loading: boolean;
    error: string | null;
    selected: string[];
    onSelect: (selected: string[]) => void;
    onRefresh?: () => void;
    onAddCollectionImage?: (collection: NFTCollection) => void;
    onAddCollectionBanner?: (collection: NFTCollection) => void;
}

const getCollectionKey = (c: NFTCollection, idx: number) => {
    // Use slug if defined, else contract_address, else index
    return c.slug ? c.slug : (c.contract_address ? c.contract_address : `collection-${idx}`);
};

// CollectionSelector: UI for selecting NFT collections
const CollectionSelector: React.FC<Props> = ({
    collections,
    loading,
    error,
    selected,
    onSelect,
    onRefresh,
    onAddCollectionImage,
    onAddCollectionBanner
}) => {
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState(false);

    // Filter collections by search, fallback to empty string
    const filtered = useMemo(() =>
        collections.filter(c =>
            (c.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (c.slug?.toLowerCase() || '').includes(search.toLowerCase())
        ), [collections, search]);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="w-full flex items-center justify-between px-6 py-4">
                <button
                    className="flex items-center gap-2 focus:outline-none"
                    onClick={() => setCollapsed(c => !c)}
                    aria-label={collapsed ? 'Expand collections' : 'Collapse collections'}
                >
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <BadgeCheck size={20} /> NFT Collections {!collapsed && collections.length > 0 && `(${collections.length})`}
                    </span>
                    {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>

                <div className="flex items-center gap-2">
                    {loading && (
                        <Loader2 size={18} className="animate-spin text-blue-500" />
                    )}
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                            title="Refresh collections"
                        >
                            <RefreshCw size={18} className={loading ? "text-gray-400" : "text-gray-600 dark:text-gray-400"} />
                        </button>
                    )}
                </div>
            </div>

            {!collapsed && (
                <div className="px-6 pb-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search collections..."
                            className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg w-full bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            {error}
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    className="ml-2 text-red-600 dark:text-red-400 underline"
                                >
                                    Try again
                                </button>
                            )}
                        </div>
                    )}

                    {loading && collections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-gray-500 dark:text-gray-400">Loading your collections...</p>
                        </div>
                    ) : !loading && filtered.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {collections.length === 0
                                ? "No collections found in connected wallets"
                                : "No collections match your search"}
                        </div>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                            {filtered.map((c, idx) => (
                                <li
                                    key={getCollectionKey(c, idx)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition"
                                >
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => onSelect(selected.includes(c.slug) ? selected.filter(s => s !== c.slug) : [...selected, c.slug])}
                                    >
                                        {c.image_url ? (
                                            <img src={c.image_url} alt={c.name || c.slug} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">?</div>
                                        )}
                                    </div>
                                    <span
                                        className="flex-1 text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                                        onClick={() => onSelect(selected.includes(c.slug) ? selected.filter(s => s !== c.slug) : [...selected, c.slug])}
                                    >
                                        {c.name || c.slug}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{c.nftCount ?? 0} owned</span>

                                    {/* Add collection image button */}
                                    {onAddCollectionImage && c.image_url && (
                                        <button
                                            onClick={() => onAddCollectionImage(c)}
                                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                            title="Add collection image to canvas"
                                        >
                                            <Image size={16} className="text-blue-500" />
                                        </button>
                                    )}

                                    

                                    <input
                                        type="checkbox"
                                        checked={selected.includes(c.slug)}
                                        readOnly
                                        className="accent-blue-500 w-4 h-4"
                                        onClick={() => onSelect(selected.includes(c.slug) ? selected.filter(s => s !== c.slug) : [...selected, c.slug])}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollectionSelector;