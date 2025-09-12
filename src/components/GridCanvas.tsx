// components/GridCanvas.tsx
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { NFT } from '../hooks/useWalletCollections';
import {
    Trash2, Download, Grid3X3, Settings, Scissors, CropIcon,
    Move, Undo, Redo, Copy, Magnet,
    Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface CanvasItem {
    id: string;
    nft: NFT;
    x: number;
    y: number;
    size: number; // Single size value for both width and height to ensure square
    zIndex: number;
    // Crop parameters
    cropX: number; // % of original image
    cropY: number;
    cropWidth: number; // % of original image
    cropHeight: number;
}

interface GridCanvasProps {
    selectedNFTs?: NFT[];
    onClearSelection?: () => void; // Callback to clear selectedNFTs in parent
}

// Resize handle directions
type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const GridCanvas = forwardRef<{ addMultipleNFTs: (nfts: NFT[]) => void }, GridCanvasProps>(({
    selectedNFTs = [],
    onClearSelection
}, ref) => {
    // Canvas state
    const [items, setItems] = useState<CanvasItem[]>([]);
    const [gridColumns, setGridColumns] = useState(12); // Configurable grid columns
    const [activeItem, setActiveItem] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [history, setHistory] = useState<CanvasItem[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [cropMode, setCropMode] = useState(false);

    // Export settings
    const [exportSize, setExportSize] = useState(800); // Default export size in pixels
    const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
    const [exportMessage, setExportMessage] = useState('');

    // Global settings for NFT display
    const [borderWidth, setBorderWidth] = useState(3); // Border width in pixels
    const [borderRadius, setBorderRadius] = useState(10); // Border radius in pixels
    const [borderColor, setBorderColor] = useState('#FFFFFF'); // Border color
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF'); // Background color

    // Refs
    const canvasRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const exportCanvasRef = useRef<HTMLDivElement>(null);

    // Interaction state
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
    const [interactionStart, setInteractionStart] = useState({ x: 0, y: 0 });
    const [initialItemState, setInitialItemState] = useState<CanvasItem | null>(null);

    const [showToolbar, setShowToolbar] = useState(false);

    // Generate a unique ID
    const generateUniqueId = () => {
        return `nft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Save current state to history
    const saveToHistory = (newItems: CanvasItem[]) => {
        // If we're not at the end of history, truncate it
        if (historyIndex < history.length - 1) {
            setHistory(history.slice(0, historyIndex + 1));
        }

        // Add new state to history
        setHistory(prev => [...prev, newItems]);
        setHistoryIndex(prev => prev + 1);
    };

    // Undo/Redo functions
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setItems(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setItems(history[historyIndex + 1]);
        }
    };

    // Calculate cell size based on grid columns
    const cellSize = 100 / gridColumns;

    // Find an empty position on the grid
    const findEmptyPosition = () => {
        // Track occupied cells
        const occupiedCells = new Set(
            items.map(item => {
                const startCol = Math.floor(item.x / cellSize);
                const startRow = Math.floor(item.y / cellSize);
                const endCol = Math.floor((item.x + item.size) / cellSize);
                const endRow = Math.floor((item.y + item.size) / cellSize);

                const cells = [];
                for (let row = startRow; row <= endRow; row++) {
                    for (let col = startCol; col <= endCol; col++) {
                        cells.push(`${col},${row}`);
                    }
                }
                return cells;
            }).flat()
        );

        // Default size: 2x2 grid cells (always square)
        const defaultSize = cellSize * 2;

        // Find first empty area
        let x = 0, y = 0;
        let found = false;

        const maxRow = Math.floor(100 / cellSize) - Math.ceil(defaultSize / cellSize) + 1;
        const maxCol = Math.floor(100 / cellSize) - Math.ceil(defaultSize / cellSize) + 1;

        for (let row = 0; row < maxRow; row++) {
            for (let col = 0; col < maxCol; col++) {
                let isEmpty = true;

                // Check if all cells in this area are empty
                for (let r = 0; r < Math.ceil(defaultSize / cellSize); r++) {
                    for (let c = 0; c < Math.ceil(defaultSize / cellSize); c++) {
                        if (occupiedCells.has(`${col + c},${row + r}`)) {
                            isEmpty = false;
                            break;
                        }
                    }
                    if (!isEmpty) break;
                }

                if (isEmpty) {
                    x = col * cellSize;
                    y = row * cellSize;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }

        // If no empty area, place it in a random position
        if (!found) {
            x = Math.random() * (100 - defaultSize);
            y = Math.random() * (100 - defaultSize);
        }

        return { x, y, size: defaultSize };
    };

    // Add NFT to the canvas
    const addNFT = (nft: NFT) => {
        // Generate a truly unique ID
        const uniqueId = generateUniqueId();

        // Find an empty cell in the grid
        const position = findEmptyPosition();

        const newItem: CanvasItem = {
            id: uniqueId,
            nft,
            x: position.x,
            y: position.y,
            size: position.size, // Single size value to ensure square
            zIndex: items.length + 1,
            // Initial crop is full image
            cropX: 0,
            cropY: 0,
            cropWidth: 100,
            cropHeight: 100
        };

        const newItems = [...items, newItem];
        setItems(newItems);
        setActiveItem(newItem.id);
        saveToHistory(newItems);
    };

    // Remove an item from the canvas
    const removeItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);
        if (activeItem === id) {
            setActiveItem(null);
        }
        saveToHistory(newItems);
    };

    // Clear the canvas
    const clearCanvas = () => {
        console.log("Clearing canvas, current items:", items.length);

        // Create a new empty array to ensure React detects the change
        const emptyItems: CanvasItem[] = [];

        // Update state with the empty array
        setItems(emptyItems);
        setActiveItem(null);

        // Update history
        saveToHistory(emptyItems);

        // Notify parent component to clear selected NFTs
        if (onClearSelection) {
            onClearSelection();
        }

        console.log("Canvas cleared");
    };

    // Handle item selection
    const selectItem = (id: string) => {
        setActiveItem(id);
        // Bring to front
        setItems(prev => {
            const newItems = [...prev];
            const maxZ = Math.max(...newItems.map(item => item.zIndex), 0);
            const itemIndex = newItems.findIndex(item => item.id === id);
            if (itemIndex >= 0) {
                newItems[itemIndex] = { ...newItems[itemIndex], zIndex: maxZ + 1 };
            }
            return newItems;
        });
    };

    // Snap value to grid
    const snapToGridValue = (value: number) => {
        if (!snapToGrid) return value;
        return Math.round(value / cellSize) * cellSize;
    };

    // Handle mouse down on an item for dragging
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        selectItem(id);
        setIsDragging(true);
        setIsResizing(false);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;

        setInteractionStart({ x, y });

        const item = items.find(item => item.id === id);
        if (item) {
            setInitialItemState({ ...item });
        }
    };

    // Handle mouse down on a resize handle
    const handleResizeStart = (e: React.MouseEvent, id: string, direction: ResizeDirection) => {
        e.preventDefault();
        e.stopPropagation();
        selectItem(id);
        setIsDragging(false);
        setIsResizing(true);
        setResizeDirection(direction);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;

        setInteractionStart({ x, y });

        const item = items.find(item => item.id === id);
        if (item) {
            setInitialItemState({ ...item });
        }
    };

    // Handle mouse move for dragging and resizing
    const handleMouseMove = (e: MouseEvent) => {
        if ((!isDragging && !isResizing) || !activeItem || !initialItemState) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) / rect.width * 100;
        const currentY = (e.clientY - rect.top) / rect.height * 100;

        const deltaX = currentX - interactionStart.x;
        const deltaY = currentY - interactionStart.y;

        if (isDragging) {
            // Handle dragging
            setItems(prev => {
                return prev.map(item => {
                    if (item.id === activeItem) {
                        let newX = initialItemState.x + deltaX;
                        let newY = initialItemState.y + deltaY;

                        // Snap to grid if enabled
                        if (snapToGrid) {
                            newX = snapToGridValue(newX);
                            newY = snapToGridValue(newY);
                        }

                        // Constrain to canvas bounds
                        newX = Math.max(0, Math.min(100 - item.size, newX));
                        newY = Math.max(0, Math.min(100 - item.size, newY));

                        return { ...item, x: newX, y: newY };
                    }
                    return item;
                });
            });
        } else if (isResizing && resizeDirection) {
            // Handle resizing - ensure items remain square
            setItems(prev => {
                return prev.map(item => {
                    if (item.id === activeItem) {
                        let newX = initialItemState.x;
                        let newY = initialItemState.y;
                        let newSize = initialItemState.size;

                        // Determine which delta (X or Y) to use based on direction
                        // For diagonal directions, use the largest delta
                        let effectiveDelta = 0;

                        if (resizeDirection === 'e') {
                            effectiveDelta = deltaX;
                        } else if (resizeDirection === 'w') {
                            effectiveDelta = -deltaX;
                        } else if (resizeDirection === 's') {
                            effectiveDelta = deltaY;
                        } else if (resizeDirection === 'n') {
                            effectiveDelta = -deltaY;
                        } else if (resizeDirection === 'ne') {
                            effectiveDelta = Math.max(deltaX, -deltaY);
                        } else if (resizeDirection === 'nw') {
                            effectiveDelta = Math.max(-deltaX, -deltaY);
                        } else if (resizeDirection === 'se') {
                            effectiveDelta = Math.max(deltaX, deltaY);
                        } else if (resizeDirection === 'sw') {
                            effectiveDelta = Math.max(-deltaX, deltaY);
                        }

                        // Apply the delta
                        if (resizeDirection.includes('e')) {
                            newSize = initialItemState.size + effectiveDelta;
                        } else if (resizeDirection.includes('w')) {
                            newSize = initialItemState.size + effectiveDelta;
                            newX = initialItemState.x + initialItemState.size - newSize;
                        } else if (resizeDirection.includes('s')) {
                            newSize = initialItemState.size + effectiveDelta;
                        } else if (resizeDirection.includes('n')) {
                            newSize = initialItemState.size + effectiveDelta;
                            newY = initialItemState.y + initialItemState.size - newSize;
                        }

                        // Enforce minimum size
                        newSize = Math.max(cellSize, newSize);

                        // Snap to grid if enabled
                        if (snapToGrid) {
                            newX = snapToGridValue(newX);
                            newY = snapToGridValue(newY);
                            newSize = snapToGridValue(newSize);
                        }

                        // Constrain to canvas bounds
                        newX = Math.max(0, newX);
                        newY = Math.max(0, newY);
                        newSize = Math.min(100 - newX, 100 - newY, newSize);

                        return {
                            ...item,
                            x: newX,
                            y: newY,
                            size: newSize
                        };
                    }
                    return item;
                });
            });
        }
    };

    // Handle mouse up to end dragging/resizing
    const handleMouseUp = () => {
        if (isDragging || isResizing) {
            // Save the current state to history
            saveToHistory([...items]);
        }

        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection(null);
        setInitialItemState(null);
    };

    // Toggle crop mode for the active item
    const toggleCropMode = () => {
        setCropMode(!cropMode);
    };

    // Update crop for the active item
    const updateCrop = (cropX: number, cropY: number, cropWidth: number, cropHeight: number) => {
        if (!activeItem) return;

        setItems(prev => {
            return prev.map(item => {
                if (item.id === activeItem) {
                    return {
                        ...item,
                        cropX: Math.max(0, Math.min(100, cropX)),
                        cropY: Math.max(0, Math.min(100, cropY)),
                        cropWidth: Math.max(10, Math.min(100 - cropX, cropWidth)),
                        cropHeight: Math.max(10, Math.min(100 - cropY, cropHeight))
                    };
                }
                return item;
            });
        });

        // Save the crop state to history
        saveToHistory([...items]);
    };

    // Method to add multiple NFTs with adaptive sizes and guaranteed minimum count
    const addMultipleNFTs = (nftsToAdd: NFT[], minCount: number) => {
        if (!nftsToAdd.length) return;

        console.log("Adding multiple NFTs:", nftsToAdd.length, "requested:", minCount);

        setItems([]);
        setActiveItem(null);

        const gridSize = Math.floor(100 / cellSize);

        // All available cells
        const availableCells: { row: number; col: number }[] = [];
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                availableCells.push({ row, col });
            }
        }

        // Shuffle NFTs
        const shuffledNFTs = [...nftsToAdd].sort(() => Math.random() - 0.5);
        const newItems: CanvasItem[] = [];

        // Placement function
        const tryPlaceNFT = (nft: NFT, index: number, maxSize: number): boolean => {
            for (let sizeMultiplier = maxSize; sizeMultiplier >= 1; sizeMultiplier--) {
                const size = cellSize * sizeMultiplier;

                for (let i = 0; i < availableCells.length; i++) {
                    const cell = availableCells[i];
                    let canFit = true;

                    // check if block fits
                    for (let r = 0; r < sizeMultiplier; r++) {
                        for (let c = 0; c < sizeMultiplier; c++) {
                            const targetRow = cell.row + r;
                            const targetCol = cell.col + c;

                            if (targetRow >= gridSize || targetCol >= gridSize) {
                                canFit = false;
                                break;
                            }

                            const exists = availableCells.find(
                                ac => ac.row === targetRow && ac.col === targetCol
                            );
                            if (!exists) {
                                canFit = false;
                                break;
                            }
                        }
                        if (!canFit) break;
                    }

                    if (canFit) {
                        // Place NFT
                        const x = cell.col * cellSize;
                        const y = cell.row * cellSize;

                        // Mark cells occupied
                        for (let r = 0; r < sizeMultiplier; r++) {
                            for (let c = 0; c < sizeMultiplier; c++) {
                                const targetRow = cell.row + r;
                                const targetCol = cell.col + c;
                                const targetIndex = availableCells.findIndex(
                                    ac => ac.row === targetRow && ac.col === targetCol
                                );
                                if (targetIndex !== -1) {
                                    availableCells.splice(targetIndex, 1);
                                }
                            }
                        }

                        newItems.push({
                            id: generateUniqueId(),
                            nft,
                            x,
                            y,
                            size,
                            zIndex: index + 1,
                            cropX: 0,
                            cropY: 0,
                            cropWidth: 100,
                            cropHeight: 100
                        });

                        return true;
                    }
                }
            }
            return false;
        };

        // Step 1: Try to place NFTs normally
        shuffledNFTs.forEach((nft, index) => {
            const isCollectionImage = nft.is_collection_image === true;
            const maxSize = isCollectionImage ? 3 : 3;
            tryPlaceNFT(nft, index, maxSize);
        });

        // Step 2: Guarantee minimum count by filling remaining with 1x1 NFTs
        if (newItems.length < minCount) {
            console.warn(
                `Only placed ${newItems.length}, need at least ${minCount}, filling with 1x1 tiles`
            );

            let fillerIndex = 0;
            while (newItems.length < minCount && availableCells.length > 0) {
                const cell = availableCells.shift();
                if (!cell) break;

                const nft = shuffledNFTs[fillerIndex % shuffledNFTs.length]; // recycle NFTs if needed
                fillerIndex++;

                newItems.push({
                    id: generateUniqueId(),
                    nft,
                    x: cell.col * cellSize,
                    y: cell.row * cellSize,
                    size: cellSize, // force 1x1
                    zIndex: newItems.length + 1,
                    cropX: 0,
                    cropY: 0,
                    cropWidth: 100,
                    cropHeight: 100
                });
            }
        }

        setItems(newItems);
        saveToHistory(newItems);
        console.log("Added", newItems.length, "NFTs to canvas");
    };
    // Fill all blank tiles on the grid
    const fillBlankTiles = (nfts: NFT[]) => {
        if (!nfts.length) return;

        console.log("Filling blank tiles with:", nfts.length, "NFTs");

        // Get occupied cells
        const occupiedCells = new Set(
            items.map(item => {
                const startCol = Math.floor(item.x / cellSize);
                const startRow = Math.floor(item.y / cellSize);
                const endCol = Math.floor((item.x + item.size) / cellSize);
                const endRow = Math.floor((item.y + item.size) / cellSize);

                const cells = [];
                for (let row = startRow; row <= endRow; row++) {
                    for (let col = startCol; col <= endCol; col++) {
                        cells.push(`${col},${row}`);
                    }
                }
                return cells;
            }).flat()
        );

        // Get all available cells
        const availableCells: { row: number, col: number }[] = [];
        for (let row = 0; row < Math.floor(100 / cellSize); row++) {
            for (let col = 0; col < Math.floor(100 / cellSize); col++) {
                if (!occupiedCells.has(`${col},${row}`)) {
                    availableCells.push({ row, col });
                }
            }
        }

        // Shuffle available cells and NFTs
        availableCells.sort(() => Math.random() - 0.5);
        const shuffledNFTs = [...nfts].sort(() => Math.random() - 0.5);

        // Create new items to fill blank tiles
        const newItems: CanvasItem[] = [...items];
        let nftIndex = 0;

        // Try to fill 1x1 cells first
        while (availableCells.length > 0 && nftIndex < shuffledNFTs.length) {
            const cell = availableCells.shift()!;
            const nft = shuffledNFTs[nftIndex++];

            // If we've used all NFTs, start over
            if (nftIndex >= shuffledNFTs.length) {
                nftIndex = 0;
            }

            const uniqueId = generateUniqueId();
            const size = cellSize;

            const newItem: CanvasItem = {
                id: uniqueId,
                nft,
                x: cell.col * cellSize,
                y: cell.row * cellSize,
                size,
                zIndex: newItems.length + 1,
                cropX: 0,
                cropY: 0,
                cropWidth: 100,
                cropHeight: 100
            };

            newItems.push(newItem);
        }

        setItems(newItems);
        saveToHistory(newItems);
        console.log("Added", newItems.length - items.length, "NFTs to fill blank tiles");
    };

    // Export canvas as image
    const exportCanvas = async () => {
        try {
            setExportStatus('exporting');
            setExportMessage('Generating image...');

            // Use the actual canvas element
            const canvas = canvasRef.current;
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            // Create a temporary canvas for export
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = exportSize;
            tempCanvas.height = exportSize;
            const ctx = tempCanvas.getContext('2d');

            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            // Set background color if specified
            if (backgroundColor) {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, exportSize, exportSize);
            }

            // Load all images first
            const loadImage = (url: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous'; // Enable CORS
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
                    img.src = url;
                });
            };

            // Sort items by z-index
            const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

            // Draw each item
            for (const item of sortedItems) {
                try {
                    // Calculate position and size
                    const x = (item.x / 100) * exportSize;
                    const y = (item.y / 100) * exportSize;
                    const size = (item.size / 100) * exportSize;

                    // Load the image
                    const img = await loadImage(item.nft.image_url);

                    // Calculate crop coordinates
                    const srcX = (item.cropX / 100) * img.width;
                    const srcY = (item.cropY / 100) * img.height;
                    const srcWidth = (item.cropWidth / 100) * img.width;
                    const srcHeight = (item.cropHeight / 100) * img.height;

                    // Create a temporary canvas for this item (to handle border radius)
                    const itemCanvas = document.createElement('canvas');
                    itemCanvas.width = size;
                    itemCanvas.height = size;
                    const itemCtx = itemCanvas.getContext('2d');

                    if (!itemCtx) continue;

                    // Apply border radius if needed
                    if (borderRadius > 0) {
                        itemCtx.beginPath();
                        itemCtx.moveTo(borderRadius, 0);
                        itemCtx.lineTo(size - borderRadius, 0);
                        itemCtx.quadraticCurveTo(size, 0, size, borderRadius);
                        itemCtx.lineTo(size, size - borderRadius);
                        itemCtx.quadraticCurveTo(size, size, size - borderRadius, size);
                        itemCtx.lineTo(borderRadius, size);
                        itemCtx.quadraticCurveTo(0, size, 0, size - borderRadius);
                        itemCtx.lineTo(0, borderRadius);
                        itemCtx.quadraticCurveTo(0, 0, borderRadius, 0);
                        itemCtx.closePath();
                        itemCtx.clip();
                    }

                    // Draw the image with crop
                    itemCtx.drawImage(
                        img,
                        srcX, srcY, srcWidth, srcHeight,
                        0, 0, size, size
                    );

                    // Add border if needed
                    if (borderWidth > 0) {
                        itemCtx.strokeStyle = borderColor;
                        itemCtx.lineWidth = borderWidth;

                        if (borderRadius > 0) {
                            itemCtx.beginPath();
                            itemCtx.moveTo(borderRadius, borderWidth / 2);
                            itemCtx.lineTo(size - borderRadius, borderWidth / 2);
                            itemCtx.quadraticCurveTo(size - borderWidth / 2, borderWidth / 2, size - borderWidth / 2, borderRadius);
                            itemCtx.lineTo(size - borderWidth / 2, size - borderRadius);
                            itemCtx.quadraticCurveTo(size - borderWidth / 2, size - borderWidth / 2, size - borderRadius, size - borderWidth / 2);
                            itemCtx.lineTo(borderRadius, size - borderWidth / 2);
                            itemCtx.quadraticCurveTo(borderWidth / 2, size - borderWidth / 2, borderWidth / 2, size - borderRadius);
                            itemCtx.lineTo(borderWidth / 2, borderRadius);
                            itemCtx.quadraticCurveTo(borderWidth / 2, borderWidth / 2, borderRadius, borderWidth / 2);
                            itemCtx.stroke();
                        } else {
                            itemCtx.strokeRect(borderWidth / 2, borderWidth / 2, size - borderWidth, size - borderWidth);
                        }
                    }

                    // Draw the item canvas onto the main canvas
                    ctx.drawImage(itemCanvas, x, y, size, size);
                } catch (err) {
                    console.error(`Error processing NFT ${item.nft.name || 'unknown'}:`, err);
                }
            }

            // Return the canvas as a promise
            return new Promise<Blob>((resolve) => {
                tempCanvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        throw new Error('Failed to create image blob');
                    }
                }, 'image/png');
            });
        } catch (error) {
            console.error('Error exporting canvas:', error);
            setExportStatus('error');
            setExportMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    };

    // Download canvas as PNG
    const downloadCanvas = async () => {
        try {
            const blob = await exportCanvas();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `nft-collage-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setExportStatus('success');
            setExportMessage('Image downloaded successfully!');

            // Reset message after 3 seconds
            setTimeout(() => {
                setExportStatus('idle');
                setExportMessage('');
            }, 3000);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    // Copy canvas to clipboard
    const copyToClipboard = async () => {
        try {
            const blob = await exportCanvas();

            // Try to use the Clipboard API
            if (navigator.clipboard && navigator.clipboard.write) {
                const clipboardItem = new ClipboardItem({
                    'image/png': blob
                });
                await navigator.clipboard.write([clipboardItem]);

                setExportStatus('success');
                setExportMessage('Image copied to clipboard!');
            } else {
                throw new Error('Clipboard API not supported');
            }

            // Reset message after 3 seconds
            setTimeout(() => {
                setExportStatus('idle');
                setExportMessage('');
            }, 3000);
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            setExportStatus('error');
            setExportMessage(`Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Reset message after 3 seconds
            setTimeout(() => {
                setExportStatus('idle');
                setExportMessage('');
            }, 3000);
        }
    };
    const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
    useEffect(() => {
        setShowToolbar(isMobile);
    }, [isMobile, activeItem]);
    // Make the canvas container a square
    useEffect(() => {
        const makeCanvasSquare = () => {
            const container = canvasContainerRef.current;
            if (container) {
                const width = container.clientWidth;
                container.style.height = `${width}px`;
            }
        };

        makeCanvasSquare();
        window.addEventListener('resize', makeCanvasSquare);

        return () => {
            window.removeEventListener('resize', makeCanvasSquare);
        };
    }, []);

    // Process selectedNFTs changes
    useEffect(() => {
        if (!selectedNFTs || selectedNFTs.length === 0) return;

        console.log("Processing selectedNFTs:", selectedNFTs.length);

        // Create a set of existing NFT identifiers for quick lookup
        const existingNFTs = new Set(
            items.map(item => {
                // Create a unique identifier based on available properties
                if (item.nft.contract && item.nft.identifier) {
                    return `${item.nft.contract}-${item.nft.identifier}`;
                }
                if (item.nft.contract_address && item.nft.token_id) {
                    return `${item.nft.contract_address}-${item.nft.token_id}`;
                }
                // Fallback to image_url if available
                return item.nft.image_url || 'unknown';
            })
        );

        // Find NFTs that aren't already on the canvas
        const newNFTs = selectedNFTs.filter(nft => {
            let nftId;
            if (nft.contract && nft.identifier) {
                nftId = `${nft.contract}-${nft.identifier}`;
            } else if (nft.contract_address && nft.token_id) {
                nftId = `${nft.contract_address}-${nft.token_id}`;
            } else {
                nftId = nft.image_url || 'unknown';
            }
            return !existingNFTs.has(nftId);
        });

        console.log("New NFTs to add:", newNFTs.length);

        // Add each new NFT to the canvas
        if (newNFTs.length > 0) {
            newNFTs.forEach(nft => {
                addNFT(nft);
            });
        }
    }, [selectedNFTs]); // Remove items from dependency array to prevent infinite loops

    // Add event listeners for mouse move and up
    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, activeItem, resizeDirection, interactionStart, initialItemState]);

    // Expose methods to the parent component
    useImperativeHandle(ref, () => ({
        addMultipleNFTs,
        fillBlankTiles
    }));

    // Get the active item
    const activeItemData = activeItem ? items.find(item => item.id === activeItem) : null;

    // Render crop overlay for the active item
    const renderCropOverlay = () => {
        if (!cropMode || !activeItemData) return null;

        return (
            <div
                className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                onClick={() => setCropMode(false)}
            >
                <div
                    className="relative bg-white dark:bg-gray-900 p-4 rounded-lg shadow-xl"
                    onClick={e => e.stopPropagation()}
                    style={{ width: '80%', maxWidth: '600px' }}
                >
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Crop Image</h3>

                    <div className="relative aspect-square mb-4 overflow-hidden border border-gray-300 dark:border-gray-700 rounded-lg">
                        <img
                            src={activeItemData.nft.image_url}
                            alt={activeItemData.nft.name || `NFT #${activeItemData.nft.token_id}`}
                            className="w-full h-full object-contain"
                        />

                        <div
                            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
                            style={{
                                left: `${activeItemData.cropX}%`,
                                top: `${activeItemData.cropY}%`,
                                width: `${activeItemData.cropWidth}%`,
                                height: `${activeItemData.cropHeight}%`
                            }}
                        // Add crop resize handlers here
                        />
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={() => setCropMode(false)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                // Apply crop
                                updateCrop(
                                    activeItemData.cropX,
                                    activeItemData.cropY,
                                    activeItemData.cropWidth,
                                    activeItemData.cropHeight
                                );
                                setCropMode(false);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                        >
                            Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const moveActiveItem = (dx: number, dy: number) => {
        if (!activeItem) return;
        setItems(prev =>
            prev.map(item => {
                if (item.id === activeItem) {
                    let newX = Math.max(0, Math.min(100 - item.size, item.x + dx));
                    let newY = Math.max(0, Math.min(100 - item.size, item.y + dy));
                    return { ...item, x: snapToGrid ? snapToGridValue(newX) : newX, y: snapToGrid ? snapToGridValue(newY) : newY };
                }
                return item;
            })
        );
        saveToHistory([...items]);
    };

    const resizeActiveItem = (delta: number) => {
        if (!activeItem) return;
        setItems(prev =>
            prev.map(item => {
                if (item.id === activeItem) {
                    let newSize = Math.max(cellSize, Math.min(100 - item.x, 100 - item.y, item.size + delta));
                    return { ...item, size: snapToGrid ? snapToGridValue(newSize) : newSize };
                }
                return item;
            })
        );
        saveToHistory([...items]);
    };
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Canvas</h2>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Grid controls */}
                    <div className="flex items-center gap-2">
                        <select
                            value={gridColumns}
                            onChange={(e) => setGridColumns(parseInt(e.target.value))}
                            className="p-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            {[4, 6, 8, 10, 12, 16, 24].map(cols => (
                                <option key={cols} value={cols}>{cols} columns</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            className={`p-2 rounded-lg ${showGrid ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                            title={showGrid ? "Hide Grid" : "Show Grid"}
                        >
                            <Grid3X3 size={16} />
                        </button>

                        <button
                            onClick={() => setSnapToGrid(!snapToGrid)}
                            className={`p-2 rounded-lg ${snapToGrid ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                            title={snapToGrid ? "Disable Snap" : "Enable Snap"}
                        >
                            <Magnet size={16} />
                        </button>
                    </div>

                    {/* Appearance controls */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-1">Border:</span>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={borderWidth}
                                onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                                className="w-12 p-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-1">Radius:</span>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={borderRadius}
                                onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                                className="w-12 p-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-1">Color:</span>
                            <input
                                type="color"
                                value={borderColor}
                                onChange={(e) => setBorderColor(e.target.value)}
                                className="w-8 h-6 p-0 border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-1">BG:</span>
                            <input
                                type="color"
                                value={backgroundColor || '#000000'}
                                onChange={(e) => setBackgroundColor(e.target.value === '#000000' ? '' : e.target.value)}
                                className="w-8 h-6 p-0 border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
                            />
                            {backgroundColor && (
                                <button
                                    onClick={() => setBackgroundColor('')}
                                    className="text-xs text-gray-500 ml-1 hover:text-red-500"
                                    title="Clear background color"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* History controls */}
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                            title="Undo"
                        >
                            <Undo size={16} />
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                            title="Redo"
                        >
                            <Redo size={16} />
                        </button>
                    </div>

                    {/* Action buttons */}
                    {activeItem && (
                        <button
                            onClick={toggleCropMode}
                            className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg"
                            title="Crop Image"
                        >
                            <Scissors size={16} />
                        </button>
                    )}

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Clear button clicked");
                            clearCanvas();
                        }}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
                        title="Clear Canvas"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas container - square aspect ratio */}
            <div
                ref={canvasContainerRef}
                className="relative bg-gray-100 dark:bg-gray-800 overflow-hidden"
                style={{
                    aspectRatio: '1/1',
                    backgroundColor: backgroundColor || undefined
                }}
            >
                {/* Grid lines */}
                {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: gridColumns + 1 }).map((_, i) => (
                            <div key={`v-${i}`} className="absolute top-0 bottom-0 border-r border-gray-300 dark:border-gray-700 opacity-30"
                                style={{ left: `${(i / gridColumns) * 100}%` }} />
                        ))}
                        {Array.from({ length: gridColumns + 1 }).map((_, i) => (
                            <div key={`h-${i}`} className="absolute left-0 right-0 border-b border-gray-300 dark:border-gray-700 opacity-30"
                                style={{ top: `${(i / gridColumns) * 100}%` }} />
                        ))}
                    </div>
                )}

                {/* Canvas content */}
                <div
                    ref={canvasRef}
                    className="absolute inset-0 overflow-hidden"
                >
                    {items.map(item => (
                        <div
                            key={item.id}
                            className={`absolute cursor-move ${activeItem === item.id ? 'ring-2 ring-blue-500' : ''}`}
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}%`,
                                width: `${item.size}%`,
                                height: `${item.size}%`,
                                zIndex: item.zIndex
                            }}
                            onMouseDown={(e) => handleMouseDown(e, item.id)}
                        >
                            <div className="relative w-full h-full">
                                {/* NFT image with crop */}
                                <div
                                    className="w-full h-full overflow-hidden shadow-md"
                                    style={{
                                        borderRadius: `${borderRadius}px`,
                                        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
                                        backgroundColor: backgroundColor || 'transparent'
                                    }}
                                >
                                    <div
                                        className="w-full h-full"
                                        style={{
                                            backgroundImage: `url(${item.nft.image_url})`,
                                            backgroundSize: `${10000 / item.cropWidth}% ${10000 / item.cropHeight}%`,
                                            backgroundPosition: `${-item.cropX * (100 / item.cropWidth)}% ${-item.cropY * (100 / item.cropHeight)}%`,
                                            backgroundRepeat: 'no-repeat'
                                        }}
                                    />
                                </div>

                                {/* Resize handles (only show for active item) */}
                                {activeItem === item.id && (
                                    <>
                                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nw-resize"
                                            onMouseDown={(e) => handleResizeStart(e, item.id, 'nw')} />
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-n-resize"
                                            onMouseDown={(e) => handleResizeStart(e, item.id, 'n')} />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-ne-resize"
                                            onMouseDown={(e) => handleResizeStart(e, item.id, 'ne')} />
                                        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-w-resize"
                                            onMouseDown={(e) => handleResizeStart(e, item.id, 'w')} />
                                        <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-e-resize"
                                            onMouseDown={(e) => handleResizeStart(e, item.id, 'e')} />
                                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-sw-resize"
                                            onMouseDown={(e) => handleResizeStart(e, item.id, 'sw')} />
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-s-resize"
                                            onMouseDown={(e) => handleResizeStart(e, item.id, 's')} />
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-se-resize"
                                            onMouseDown={(e) => handleResizeStart(e, item.id, 'se')} />

                                        {/* Control buttons */}
                                        <div className="absolute -top-8 right-0 flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleCropMode(); }}
                                                className="p-1 bg-purple-500 text-white rounded-full shadow-md"
                                                title="Crop"
                                            >
                                                <CropIcon size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                                className="p-1 bg-red-500 text-white rounded-full shadow-md"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            {activeItem && (
                                <>
                                    {/* Floating edit button (desktop only, hidden if toolbar open or on mobile) */}
                                    {!showToolbar && !isMobile && (
                                        <button
                                            className="fixed md:absolute z-50 bottom-4 left-1/2 md:top-4 md:right-4 md:left-auto md:bottom-auto transform -translate-x-1/2 md:translate-x-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
                                            style={{ pointerEvents: 'auto' }}
                                            onClick={() => setShowToolbar(true)}
                                            title="Edit"
                                        >
                                            <Move size={22} />
                                        </button>
                                    )}

                                    {/* Floating toolbar */}
                                    {(showToolbar || isMobile) && (
                                        <div
                                            className="fixed md:absolute z-50 flex flex-row md:flex-col gap-1 bottom-4 left-1/2 md:top-4 md:right-4 md:left-auto md:bottom-auto transform -translate-x-1/2 md:translate-x-0 bg-white/90 dark:bg-gray-900/90 p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            {/* Move */}
                                            <button
                                                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                onClick={() => moveActiveItem(0, -cellSize)}
                                                title="Move up"
                                            >
                                                <ArrowUp size={20} />
                                            </button>
                                            <div className="flex">
                                                <button
                                                    className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                    onClick={() => moveActiveItem(-cellSize, 0)}
                                                    title="Move left"
                                                >
                                                    <ArrowLeft size={20} />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                    onClick={() => moveActiveItem(cellSize, 0)}
                                                    title="Move right"
                                                >
                                                    <ArrowRight size={20} />
                                                </button>
                                            </div>
                                            <button
                                                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                onClick={() => moveActiveItem(0, cellSize)}
                                                title="Move down"
                                            >
                                                <ArrowDown size={20} />
                                            </button>

                                            {/* Resize */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                    onClick={() => resizeActiveItem(cellSize)}
                                                    title="Increase size"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                    onClick={() => resizeActiveItem(-cellSize)}
                                                    title="Decrease size"
                                                >
                                                    <Minus size={20} />
                                                </button>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                onClick={() => removeItem(activeItem)}
                                                title="Delete"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                            {/* Collapse/close button (desktop only) */}
                                            {!isMobile && (
                                                <button
                                                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                    onClick={() => setShowToolbar(false)}
                                                    title="Close"
                                                >
                                                    <Move size={20} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}

                    {/* Empty state */}
                    {items.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                            <Move size={48} className="mb-2 opacity-50" />
                            <p className="text-lg font-medium">Select NFTs to add to canvas</p>
                            <p className="text-sm">Click on NFTs in the list to add them here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Export controls */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Export size:</span>
                        <input
                            type="number"
                            min="100"
                            max="4000"
                            step="100"
                            value={exportSize}
                            onChange={(e) => setExportSize(parseInt(e.target.value))}
                            className="w-20 p-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <span className="text-sm text-gray-500">px</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={downloadCanvas}
                            disabled={exportStatus === 'exporting' || items.length === 0}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
                        >
                            <Download size={16} />
                            <span>Download PNG</span>
                        </button>

                        <button
                            onClick={copyToClipboard}
                            disabled={exportStatus === 'exporting' || items.length === 0}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
                        >
                            <Copy size={16} />
                            <span>Copy to Clipboard</span>
                        </button>
                    </div>
                </div>

                {/* Export status message */}
                {exportStatus !== 'idle' && (
                    <div className={`mt-2 p-2 rounded text-sm ${exportStatus === 'exporting' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                        exportStatus === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                            'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                        {exportMessage}
                    </div>
                )}
            </div>

            {/* Crop overlay */}
            {renderCropOverlay()}
        </div>
    );
});

export default GridCanvas;