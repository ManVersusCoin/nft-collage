// hooks/useWalletCollections.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchNFTsByAccount, fetchCollections } from '../services/openseaApi';

export interface NFT {
    id?: string;
    contract_address?: string;
    token_id?: string;
    name?: string;
    image_url?: string;
    collection?: string;
    [key: string]: any; // Allow additional properties
}

export interface NFTCollection {
    slug: string;
    name: string;
    image_url: string;
    banner_image_url?: string;
    contract_address: string;
    nftCount?: number;
    [key: string]: any; // Allow additional properties
}

interface UseWalletCollectionsResult {
    collections: NFTCollection[];
    nfts: NFT[];
    loading: boolean;
    error: string | null;
    refreshData: () => void;
    loadMoreNFTs: () => Promise<void>;
    hasMoreNFTs: boolean;
    loadingMore: boolean;
}

interface WalletEntry {
    address: string;
    chain: string;
}

// Hook to fetch NFT collections and NFTs for a list of wallets
export function useWalletCollections(wallets: WalletEntry[]): UseWalletCollectionsResult {
    const [collections, setCollections] = useState<NFTCollection[]>([]);
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCursors, setNextCursors] = useState<Record<string, string>>({});
    const [hasMoreNFTs, setHasMoreNFTs] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch data for all wallets
    const fetchData = useCallback(async () => {
        if (wallets.length === 0) {
            setCollections([]);
            setNfts([]);
            return;
        }

        setLoading(true);
        setError(null);
        setNextCursors({});

        try {
            const allCollections: NFTCollection[] = [];
            const allNFTs: NFT[] = [];
            const newNextCursors: Record<string, string> = {};

            for (const wallet of wallets) {
                try {
                    // Fetch collections
                    const walletCollections = await fetchCollections(wallet.address, wallet.chain);
                    allCollections.push(...walletCollections);

                    // Fetch NFTs with pagination
                    const response = await fetchNFTsByAccount(wallet.address, wallet.chain);
                    allNFTs.push(...response.nfts);

                    // Store next cursor if available
                    if (response.next) {
                        newNextCursors[`${wallet.address}-${wallet.chain}`] = response.next;
                    }
                } catch (err) {
                    console.error(`Error fetching data for wallet ${wallet.address}:`, err);
                }
            }

            // Deduplicate collections by slug
            const uniqueCollections = allCollections.reduce<NFTCollection[]>((acc, collection) => {
                if (!acc.some(c => c.slug === collection.slug)) {
                    acc.push(collection);
                }
                return acc;
            }, []);

            setCollections(uniqueCollections);
            setNfts(allNFTs);
            setNextCursors(newNextCursors);
            setHasMoreNFTs(Object.keys(newNextCursors).length > 0);
        } catch (err) {
            console.error('Error fetching wallet collections:', err);
            setError('Failed to load NFT data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [wallets]);

    // Load more NFTs
    const loadMoreNFTs = async () => {
        if (loadingMore || Object.keys(nextCursors).length === 0) return;

        setLoadingMore(true);
        try {
            const newNFTs: NFT[] = [];
            const newNextCursors: Record<string, string> = {};

            for (const wallet of wallets) {
                const key = `${wallet.address}-${wallet.chain}`;
                const cursor = nextCursors[key];

                if (cursor) {
                    const response = await fetchNFTsByAccount(wallet.address, wallet.chain, 50, cursor);
                    newNFTs.push(...response.nfts);

                    if (response.next) {
                        newNextCursors[key] = response.next;
                    }
                }
            }

            setNfts(prev => [...prev, ...newNFTs]);
            setNextCursors(newNextCursors);
            setHasMoreNFTs(Object.keys(newNextCursors).length > 0);
        } catch (err) {
            console.error('Error loading more NFTs:', err);
            setError('Failed to load more NFTs. Please try again.');
        } finally {
            setLoadingMore(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        collections,
        nfts,
        loading,
        error,
        refreshData: fetchData,
        loadMoreNFTs,
        hasMoreNFTs,
        loadingMore
    };
}