// openseaapi.ts
import axios from 'axios';

// Axios instance for OpenSea API
const api = axios.create({
    baseURL: 'https://api.opensea.io/api/v2/',
    headers: {
        'X-API-KEY': import.meta.env.VITE_OPENSEA_API_KEY,
    },
});

// Fetch NFTs for a wallet and chain with pagination
export async function fetchNFTsByAccount(wallet: string, chain: string, limit = 50, next = '') {
    try {
        const url = `/chain/${chain}/account/${wallet}/nfts`;
        const params: Record<string, string | number> = { limit };

        if (next) {
            params.next = next;
        }

        const res = await api.get(url, { params });
        return {
            nfts: res.data.nfts || [],
            next: res.data.next || null
        };
    } catch (error) {
        throw error;
    }
}

// Fetch all NFTs for a wallet with pagination handling
export async function fetchAllNFTsByAccount(wallet: string, chain: string, maxPages = 10) {
    let allNFTs: any[] = [];
    let nextCursor = '';
    let page = 0;

    try {
        do {
            const { nfts, next } = await fetchNFTsByAccount(wallet, chain, 50, nextCursor);
            allNFTs = [...allNFTs, ...nfts];
            nextCursor = next;
            page++;

            // Stop if we've reached maxPages or there's no next cursor
            if (page >= maxPages || !nextCursor) break;
        } while (nextCursor);

        return allNFTs;
    } catch (error) {
        throw error;
    }
}

// Fetch collection details by slug
export async function fetchCollectionDetails(slug: string) {
    try {
        const res = await api.get(`/collections/${slug}`);
        return res.data;
    } catch (error) {
        // If slug is invalid, return null
        return null;
    }
}

// Get unique collections for a wallet
export async function fetchCollections(wallet: string, chain: string) {
    const nfts = await fetchAllNFTsByAccount(wallet, chain);
    // Only use valid slugs
    const slugCount: Record<string, number> = {};
    nfts.forEach((nft: any) => {
        if (nft.collection && typeof nft.collection === 'string') {
            slugCount[nft.collection] = (slugCount[nft.collection] || 0) + 1;
        }
    });
    const uniqueSlugs = Object.keys(slugCount).filter(Boolean);
    const collections = [];
    for (const slug of uniqueSlugs) {
        const details = await fetchCollectionDetails(slug);
        if (details && details.collection) {
            collections.push({
                slug: details.collection,
                name: details.name || details.collection,
                image_url: details.image_url || '',
                banner_image_url: details.banner_image_url || '',
                contract_address: details.contracts?.[0]?.address || '',
                nftCount: slugCount[slug],
            });
        } else {
            // fallback if details are missing
            collections.push({
                slug,
                name: slug,
                image_url: '',
                banner_image_url: '',
                contract_address: '',
                nftCount: slugCount[slug],
            });
        }
    }
    return collections;
}