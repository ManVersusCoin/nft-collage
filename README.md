# 🖼️ NFT Collage --- NFT Grid Builder

A **modern, responsive React app** built with **TypeScript + Vite** that
lets users explore their NFT collections and
curate them into **customizable, free-form grids**.

This tool is for NFT collectors who want to **design, share, and
export** unique collages of their digital assets.

------------------------------------------------------------------------

## ✨ Features

-   **🔑 Wallet Management**
    -   Add multiple wallet addresses and select blockchain (Ethereum,
        Abstract, Base,... etc.).\
    -   Input validation for wallet addresses.
-   **📦 Collection Picker**
    -   Fetch collections from OpenSea v2 API.\
    -   Searchable dropdown with optional restriction (`.env` allowed
        contracts).\
    -   Multi-select support.
-   **🖼️ NFT & Image Selection**
    -   Select/deselect NFTs for your grid.\
    -   Add external images via URL or upload (validated).
-   **📐 Flexible Grid Workspace**
    -   Drag, drop, move, and resize NFTs/images freely.\
    -   Powered by `react-rnd`.\
-   **🌗 Dark/Light Mode**
    -   Toggle between light and dark mode.\
    -   Theme persistence via `localStorage`.
-   **⚡ Extra Goodies**
    -   Export/share grid as **PNG** (`html2canvas`)

------------------------------------------------------------------------

## 🛠 Tech Stack

-   [Vite](https://vitejs.dev/) --- Fast build & dev\
-   [React (TSX)](https://react.dev/) --- UI\
-   [Tailwind CSS](https://tailwindcss.com/) --- Styling\
-   [lucide-react](https://lucide.dev/) --- Icons\
-   [react-rnd](https://github.com/bokuweb/react-rnd) --- Resize & drag
    support\
-   [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) --- Drag &
    drop for lists\
-   [Axios](https://axios-http.com/) --- API requests\
-   [React Query (optional)](https://tanstack.com/query) --- API
    caching\
-   [Zustand (optional)](https://zustand-demo.pmnd.rs/) --- Global
    state\
-   [html2canvas](https://html2canvas.hertzen.com/) --- Export grids

------------------------------------------------------------------------


## ⚙️ Configuration

Create a `.env` file in the project root:

``` bash
VITE_OPENSEA_API_KEY=<your_opensea_api_key>
VITE_ALLOWED_CONTRACTS=["0x123...", "0x456..."] # leave empty for no restriction
```

------------------------------------------------------------------------

## 🚀 Getting Started

Clone the repository:

``` bash
git clone https://github.com/ManVersusCoin/nft-collage.git
cd nft-collage
```

Install dependencies:

``` bash
npm install
```

Run in development:

``` bash
npm run dev
```

Build for production:

``` bash
npm run build
```

Preview build:

``` bash
npm run preview
```



------------------------------------------------------------------------

## 🤝 Contributing

Pull requests are welcome! If you'd like to propose major changes,
please open an issue first to discuss.


