# Hedera CertChain 🏅

A blockchain-based certificate verification system built on the Hedera Hashgraph network. This application enables secure issuance, storage, and verification of digital certificates using NFTs and IPFS for immutable proof of achievement.

## 🏗️ Architecture Overview

### Project Structure (Betty Coding Style)

```
src/
├── core/                          # Core application modules
│   ├── config/                    # Application configuration
│   │   └── app.config.ts         # Main config with network settings
│   ├── types/                     # TypeScript type definitions
│   │   └── index.ts              # All application types
│   ├── constants/                 # Application constants
│   │   └── index.ts              # Error codes, limits, endpoints
│   └── index.ts                  # Core module exports
├── features/                      # Feature-based modules
│   ├── certificates/             # Certificate management
│   │   ├── services/             # Certificate business logic
│   │   │   ├── crypto.service.ts # Cryptographic operations
│   │   │   └── ipfs.service.ts   # IPFS storage operations
│   │   ├── components/           # Certificate UI components
│   │   └── pages/                # Certificate page components
│   └── wallets/                  # Wallet integration
│       ├── services/             # Wallet business logic
│       │   └── wallet.interface.ts # Standard wallet interface
│       ├── contexts/             # Wallet state management
│       └── components/           # Wallet UI components
├── shared/                       # Shared utilities and components
│   ├── components/               # Reusable UI components
│   ├── utils/                    # Utility functions
│   │   ├── logger.util.ts       # Application logging
│   │   ├── validation.util.ts    # Form validation
│   │   └── error-handler.util.ts # Error handling
│   └── index.ts                 # Shared module exports
└── App.tsx                      # Main application component
```

## 🚀 Features

### Certificate Management
- **Issue Certificates**: Create blockchain-based certificates with IPFS metadata
- **Verify Certificates**: Validate certificate authenticity using blockchain data
- **NFT Integration**: Certificates are minted as NFTs for ownership and transfer
- **Secure Storage**: Files stored on IPFS with Pinata pinning service

### Multi-Wallet Support
- **MetaMask**: Browser extension wallet for Ethereum and Hedera
- **HashPack**: Native Hedera wallet with advanced features
- **Blade Wallet**: Hedera-focused wallet integration
- **Kabila Wallet**: Multi-chain wallet support
- **WalletConnect**: Mobile wallet connectivity via QR codes

## 🛠️ Technical Stack

- **React 18 + TypeScript**: Modern frontend framework
- **Hedera Hashgraph**: Blockchain network for consensus
- **IPFS + Pinata**: Decentralized file storage
- **Tailwind CSS + shadcn/ui**: Modern UI framework
- **Vite**: Fast build tool with hot reload

## 📋 Coding Standards (Betty Style)

### Naming Conventions
- **Functions**: `snake_case` (e.g., `generate_certificate_hash`)
- **Variables**: `snake_case` (e.g., `user_email`, `contract_address`)
- **Constants**: `UPPER_CASE` (e.g., `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`)
- **Components**: `PascalCase` (e.g., `CertificateForm`, `WalletConnector`)

### Documentation Standards
- **File Headers**: Comprehensive descriptions with author and dates
- **Function Documentation**: Purpose, parameters, return values
- **Error Handling**: Consistent categorization and user-friendly messages

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/65d1d4ed-b874-4cfa-b01b-b7a8d899c0d6) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
