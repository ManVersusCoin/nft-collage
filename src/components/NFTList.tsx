// components/NFTList.tsx
import React, { useState, useMemo } from 'react';
import { NFT } from '../hooks/useWalletCollections';
import { Image, Grid, ChevronDown, ChevronUp, Loader2, RefreshCw, Search, Check } from 'lucide-react';

interface NFTListProps {
    nfts: NFT[];
    loading: boolean;
    error: string | null;
    selectedCollections: string[];
    selectedNFTs?: NFT[]; // Add this to track NFTs already in the grid
    onSelectNFT?: (nft: NFT) => void;
    onRefresh?: () => void;
    onLoadMore?: () => void; // Add this for pagination
    hasMoreNFTs?: boolean; // Add this to indicate if there are more NFTs to load
    loadingMore?: boolean; // Add this to indicate if more NFTs are being loaded
}

const NFTList: React.FC<NFTListProps> = ({
    nfts,
    loading,
    error,
    selectedCollections,
    selectedNFTs = [],
    onSelectNFT,
    onRefresh,
    onLoadMore,
    hasMoreNFTs = false,
    loadingMore = false
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Check if an NFT is already in the grid
    const isNFTSelected = (nft: NFT) => {
        return selectedNFTs.some(selectedNFT =>
            (nft.contract_address && nft.token_id &&
                selectedNFT.contract_address === nft.contract_address &&
                selectedNFT.token_id === nft.token_id) ||
            (nft.id && selectedNFT.id === nft.id) ||
            (nft.image_url && selectedNFT.image_url === nft.image_url)
        );
    };

    // Filter NFTs by selected collections and search term
    const filteredNfts = useMemo(() => {
        let filtered = nfts;

        // Filter by collections if any are selected
        if (selectedCollections.length > 0) {
            filtered = filtered.filter(nft =>
                nft.collection && selectedCollections.includes(nft.collection)
            );
        }

        // Filter by search term if provided
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(nft =>
                (nft.name?.toLowerCase().includes(term)) ||
                (nft.token_id?.toString().includes(term)) ||
                (nft.collection?.toLowerCase().includes(term))
            );
        }

        return filtered;
    }, [nfts, selectedCollections, searchTerm]);

    // Generate a unique key for each NFT
    const getNFTKey = (nft: NFT, index: number) => {
        // Use contract_address and token_id if they exist
        if (nft.contract_address && nft.token_id) {
            return `${nft.contract_address}-${nft.token_id}`;
        }
        // Fallback to id if it exists
        if (nft.id) {
            return nft.id;
        }
        // Last resort: use index
        return `nft-${index}`;
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="w-full flex items-center justify-between px-6 py-4">
                <button
                    className="flex items-center gap-2 focus:outline-none"
                    onClick={() => setCollapsed(c => !c)}
                    aria-label={collapsed ? 'Expand NFT list' : 'Collapse NFT list'}
                >
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Image size={20} /> NFT Assets {!collapsed && filteredNfts.length > 0 && `(${filteredNfts.length})`}
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
                            title="Refresh NFTs"
                        >
                            <RefreshCw size={18} className={loading ? "text-gray-400" : "text-gray-600 dark:text-gray-400"} />
                        </button>
                    )}
                </div>
            </div>

            {!collapsed && (
                <div className="px-6 pb-6">
                    {/* Search input */}
                    <div className="mb-4 flex items-center gap-2">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search NFTs..."
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

                    {loading && nfts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-gray-500 dark:text-gray-400">Loading your NFTs...</p>
                        </div>
                    ) : !loading && filteredNfts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {nfts.length === 0
                                ? "No NFTs found in connected wallets"
                                : searchTerm
                                    ? "No NFTs match your search"
                                    : selectedCollections.length === 0
                                        ? "Select collections to filter NFTs"
                                        : "No NFTs found in selected collections"}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                                {filteredNfts.map((nft, index) => {
                                    const isSelected = isNFTSelected(nft);
                                    return (
                                        <div
                                            key={getNFTKey(nft, index)}
                                            className={`relative group cursor-pointer rounded-lg overflow-hidden border ${isSelected
                                                    ? 'border-green-500 dark:border-green-500'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500'
                                                } transition`}
                                            onClick={() => {
                                                console.log("NFT clicked:", nft);
                                                if (onSelectNFT) onSelectNFT(nft);
                                            }}
                                        >
                                            <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                                                {nft.image_url ? (
                                                    <img
                                                        src={nft.image_url}
                                                        alt={nft.name || `NFT #${nft.token_id}`}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <Grid size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                {nft.name || `#${nft.token_id || 'Unknown'}`}
                                            </div>

                                            {/* Indicator for NFTs already in the grid */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                                    <Check size={14} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Load more button */}
                            {hasMoreNFTs && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={onLoadMore}
                                        disabled={loadingMore}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 size={16} className="inline-block animate-spin mr-2" />
                                                Loading more...
                                            </>
                                        ) : (
                                            'Load more NFTs'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default NFTList;