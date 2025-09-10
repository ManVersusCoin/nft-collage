// App.tsx
import React, { useState, useRef } from 'react';
import WalletManager, { WalletEntry } from './components/WalletManager';
import ThemeToggle from './components/ThemeToggle';
import CollectionSelector from './components/CollectionSelector';
import TraitFilter from './components/TraitFilter';
import GridCanvas from './components/GridCanvas';
import NFTList from './components/NFTList';
//import ShuffleForm from './components/ShuffleForm';
import { useWalletCollections, NFT } from './hooks/useWalletCollections';

const App: React.FC = () => {
    const [wallets, setWallets] = useState<WalletEntry[]>([]);
    const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
    const [selectedNFTs, setSelectedNFTs] = useState<NFT[]>([]);

    // Reference to GridCanvas for calling its methods
    const gridCanvasRef = useRef<any>(null);

    // Use the enhanced hook with all wallets
    const {
        collections,
        nfts,
        loading,
        error,
        refreshData,
        loadMoreNFTs,
        hasMoreNFTs,
        loadingMore
    } = useWalletCollections(wallets);

    // When wallets change, reset selected collections
    const handleWalletsChange = (newWallets: WalletEntry[]) => {
        setWallets(newWallets);
        setSelectedCollections([]);
    };

    // Handle NFT selection to add to canvas
    const handleSelectNFT = (nft: NFT) => {
        console.log("Attempting to add NFT:", nft);

        // Check if NFT is already selected
        const isAlreadySelected = selectedNFTs.some(selectedNFT => {
            // Try to match by contract and token id
            if (selectedNFT.contract_address && nft.contract_address &&
                selectedNFT.token_id && nft.token_id) {
                return selectedNFT.contract_address === nft.contract_address &&
                    selectedNFT.token_id === nft.token_id;
            }

            // Try to match by id
            if (selectedNFT.id && nft.id) {
                return selectedNFT.id === nft.id;
            }

            // Last resort: compare image URLs
            return selectedNFT.image_url === nft.image_url;
        });

        if (isAlreadySelected) {
            console.log("NFT already on canvas");
        } else {
            console.log("Adding NFT to canvas");
            setSelectedNFTs(prev => [...prev, nft]);
        }
    };

    // Handle adding shuffled NFTs to the canvas
    // Handle adding shuffled NFTs to the canvas
    const handleAddShuffledNFTs = (shuffledNFTs: NFT[], minCount?: number) => {
        console.log("handleAddShuffledNFTs called with:", shuffledNFTs.length, "NFTs, minCount:", minCount);

        // Use the GridCanvas's addMultipleNFTs method (pass minCount)
        if (gridCanvasRef.current && gridCanvasRef.current.addMultipleNFTs) {
            // if minCount is not provided, fallback to the number of items requested
            gridCanvasRef.current.addMultipleNFTs(shuffledNFTs, minCount ?? shuffledNFTs.length);
        }
    };

    // Handle filling blank tiles
    const handleFillBlankTiles = (nfts: NFT[]) => {
        console.log("handleFillBlankTiles called with:", nfts.length, "NFTs");

        // Use the GridCanvas's fillBlankTiles method
        if (gridCanvasRef.current && gridCanvasRef.current.fillBlankTiles) {
            gridCanvasRef.current.fillBlankTiles(nfts);
        }
    };

    // Handle adding collection image to canvas
    const handleAddCollectionImage = (collection: NFTCollection) => {
        if (!collection.image_url) return;

        // Create an NFT-like object for the collection image
        const collectionImage: NFT = {
            id: `collection-image-${collection.slug}-${Date.now()}`,
            name: `${collection.name} Logo`,
            image_url: collection.image_url,
            collection: collection.slug,
            is_collection_image: true
        };

        handleSelectNFT(collectionImage);
    };

    // Handle adding collection banner to canvas
    const handleAddCollectionBanner = (collection: NFTCollection) => {
        if (!collection.banner_image_url) return;

        // Create an NFT-like object for the collection banner
        const collectionBanner: NFT = {
            id: `collection-banner-${collection.slug}-${Date.now()}`,
            name: `${collection.name} Banner`,
            image_url: collection.banner_image_url,
            collection: collection.slug,
            is_collection_image: true
        };

        handleSelectNFT(collectionBanner);
    };

    // Clear selected NFTs
    const handleClearSelectedNFTs = () => {
        setSelectedNFTs([]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans">
            <header className="w-full py-6 px-4 bg-white dark:bg-gray-900 shadow flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-1">
                        🎭 NFT Collage
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
                        Modern React NFT Grid Builder (OpenSea v2 API)
                    </p>
                </div>
                <ThemeToggle />
            </header>
            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Right column: tools */}
                <aside className="md:col-span-1 flex flex-col gap-6">
                    <WalletManager wallets={wallets} onChange={handleWalletsChange} />
                    <CollectionSelector
                        collections={collections}
                        loading={loading}
                        error={error}
                        selected={selectedCollections}
                        onSelect={setSelectedCollections}
                        onRefresh={refreshData}
                        onAddCollectionImage={handleAddCollectionImage}
                        onAddCollectionBanner={handleAddCollectionBanner}
                    />
                    <NFTList
                        nfts={nfts}
                        loading={loading}
                        error={error}
                        selectedCollections={selectedCollections}
                        selectedNFTs={selectedNFTs}
                        onSelectNFT={handleSelectNFT}
                        onRefresh={refreshData}
                        onLoadMore={loadMoreNFTs}
                        hasMoreNFTs={hasMoreNFTs}
                        loadingMore={loadingMore}
                    />
                    {/* 
                    <ShuffleForm
                        nfts={nfts}
                        collections={collections}
                        selectedCollections={selectedCollections}
                        onAddNFTs={handleAddShuffledNFTs}
                        onFillBlankTiles={handleFillBlankTiles}
                    />
                    */}
                    {/* <TraitFilter /> */}
                </aside>
                {/* Left column: grid/collage */}
                <section className="md:col-span-2">
                    <GridCanvas
                        ref={gridCanvasRef}
                        selectedNFTs={selectedNFTs}
                        onClearSelection={handleClearSelectedNFTs}
                    />
                </section>
            </main>
            <footer className="w-full py-6 mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
                © 2024 NFT Collage. Powered by React, Vite & Tailwind CSS.
            </footer>
        </div>
    );
};

export default App;