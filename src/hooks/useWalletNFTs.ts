// hooks/useWalletNFTs.ts
import { useState, useEffect } from 'react';
import { WalletEntry } from '../components/WalletManager';

export interface NFT {
    id: string;
    name: string;
    description?: string;
    image_url: string;
    collection: {
        slug: string;
        name: string;
    };
    permalink: string;
    token_id: string;
    contract_address: string;
}

export function useWalletNFTs(wallets: WalletEntry[], selectedCollections: string[]) {
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (wallets.length === 0) {
            setNfts([]);
            return;
        }

        async function fetchNFTs() {
            setLoading(true);
            setError(null);

            try {
                // For each wallet, fetch NFTs
                const allNfts: NFT[] = [];

                for (const wallet of wallets) {
                    // In a real app, you would call the OpenSea API here
                    // For demonstration, we'll use a mock response
                    const mockResponse = await fetch(`/api/mock/nfts?wallet=${wallet.address}&chain=${wallet.chain}`).catch(() => null);

                    if (mockResponse) {
                        const data = await mockResponse.json();
                        allNfts.push(...data.nfts);
                    }
                }

                // Filter by selected collections if any are selected
                const filtered = selectedCollections.length > 0
                    ? allNfts.filter(nft => selectedCollections.includes(nft.collection.slug))
                    : allNfts;

                setNfts(filtered);
            } catch (err) {
                console.error("Error fetching NFTs:", err);
                setError("Failed to load NFTs");
            } finally {
                setLoading(false);
            }
        }

        fetchNFTs();
    }, [wallets, selectedCollections]);

    return { nfts, loading, error };
}