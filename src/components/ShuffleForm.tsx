// components/ShuffleForm.tsx
import React, { useState } from 'react';
import { NFT, NFTCollection } from '../hooks/useWalletCollections';
import { Shuffle, Grid3X3 } from 'lucide-react';

interface ShuffleFormProps {
    nfts: NFT[];
    collections: NFTCollection[];
    selectedCollections: string[];
    onAddNFTs: (nfts: NFT[], minCount: number) => void; // <-- on passe aussi le nombre
    onFillBlankTiles?: (nfts: NFT[]) => void;
}

const ShuffleForm: React.FC<ShuffleFormProps> = ({
    nfts,
    collections,
    selectedCollections,
    onAddNFTs,
    onFillBlankTiles
}) => {
    const [count, setCount] = useState(5);
    const [includeCollectionImages, setIncludeCollectionImages] = useState(true);
    const [useSelectedCollections, setUseSelectedCollections] = useState(true);
    const [fillEmptyTiles, setFillEmptyTiles] = useState(false);

    const handleShuffle = () => {
        console.log("Shuffle button clicked");

        // Step 1: Filter NFTs based on selected collections if needed
        let availableNFTs = [...nfts];
        if (useSelectedCollections && selectedCollections.length > 0) {
            availableNFTs = nfts.filter(nft =>
                nft.collection && selectedCollections.includes(nft.collection)
            );
        }

        // Step 2: Shuffle and select random NFTs
        let shuffledNFTs = [...availableNFTs].sort(() => Math.random() - 0.5);

        const nftCount = Math.min(count, shuffledNFTs.length);
        let selectedNFTs = shuffledNFTs.slice(0, nftCount);

        // Step 3: Add collection images if requested
        if (includeCollectionImages) {
            const nftCollections = new Set<string>();
            selectedNFTs.forEach(nft => {
                if (nft.collection) {
                    nftCollections.add(nft.collection);
                }
            });

            let availableCollections = [...collections];
            if (useSelectedCollections && selectedCollections.length > 0) {
                availableCollections = collections.filter(collection =>
                    selectedCollections.includes(collection.slug)
                );
            }

            const collectionNFTs: NFT[] = [];
            availableCollections.forEach(collection => {
                if (collection.image_url) {
                    collectionNFTs.push({
                        id: `collection-image-${collection.slug}-${Date.now()}-${Math.random()
                            .toString(36)
                            .substring(2, 9)}`,
                        name: `${collection.name} Logo`,
                        image_url: collection.image_url,
                        collection: collection.slug,
                        is_collection_image: true
                    });
                }
            });

            const shuffledCollectionNFTs = collectionNFTs.sort(() => Math.random() - 0.5);
            const collectionCount = Math.min(Math.ceil(nftCount / 2), shuffledCollectionNFTs.length);
            const selectedCollectionNFTs = shuffledCollectionNFTs.slice(0, collectionCount);

            selectedNFTs = [...selectedNFTs, ...selectedCollectionNFTs];
        }

        console.log("Final selection:", selectedNFTs.length);

        // Step 4: Call the callback with NFTs AND the count
        onAddNFTs(selectedNFTs, count);

        // Step 5: Optionally fill empty tiles
        if (fillEmptyTiles && onFillBlankTiles) {
            const remainingNFTs = shuffledNFTs.slice(nftCount);
            if (remainingNFTs.length > 0) {
                onFillBlankTiles(remainingNFTs);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Shuffle size={20} /> Shuffle NFTs
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Number of NFTs to add
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={count}
                        onChange={e => setCount(parseInt(e.target.value) || 5)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none"
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="includeCollectionImages"
                        checked={includeCollectionImages}
                        onChange={e => setIncludeCollectionImages(e.target.checked)}
                        className="accent-blue-500 w-4 h-4 mr-2"
                    />
                    <label htmlFor="includeCollectionImages" className="text-sm text-gray-700 dark:text-gray-300">
                        Include collection images
                    </label>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="useSelectedCollections"
                        checked={useSelectedCollections}
                        onChange={e => setUseSelectedCollections(e.target.checked)}
                        className="accent-blue-500 w-4 h-4 mr-2"
                    />
                    <label htmlFor="useSelectedCollections" className="text-sm text-gray-700 dark:text-gray-300">
                        Use only selected collections
                    </label>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="fillEmptyTiles"
                        checked={fillEmptyTiles}
                        onChange={e => setFillEmptyTiles(e.target.checked)}
                        className="accent-blue-500 w-4 h-4 mr-2"
                    />
                    <label htmlFor="fillEmptyTiles" className="text-sm text-gray-700 dark:text-gray-300">
                        Fill empty tiles with remaining NFTs
                    </label>
                </div>

                <button
                    onClick={handleShuffle}
                    className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-600 transition"
                >
                    <Shuffle size={16} />
                    Shuffle and add to Canvas
                </button>

                {onFillBlankTiles && (
                    <button
                        onClick={() => {
                            let availableNFTs = [...nfts];
                            if (useSelectedCollections && selectedCollections.length > 0) {
                                availableNFTs = nfts.filter(nft =>
                                    nft.collection && selectedCollections.includes(nft.collection)
                                );
                            }
                            onFillBlankTiles(availableNFTs);
                        }}
                        className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition mt-2"
                    >
                        <Grid3X3 size={16} />
                        Fill empty tiles
                    </button>
                )}
            </div>
        </div>
    );
};

export default ShuffleForm;
