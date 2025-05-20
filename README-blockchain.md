# Blockchain-Based Agricultural Commodities Trading Platform

This document provides detailed information about the blockchain components of the Agricultural Commodities Trading Platform.

## Overview

The platform uses blockchain technology to enable secure, transparent, and efficient trading of agricultural commodities. It is built on Ethereum with Polygon L2 scaling for high performance and low transaction costs.

## Architecture

### Blockchain Infrastructure

- **Primary Network**: Ethereum Mainnet
- **Scaling Solution**: Polygon L2 with proof-of-stake consensus
- **Oracle Integration**: Chainlink Network for price feeds
- **Performance**: 1000+ TPS, maximum 2-second latency
- **Gas Optimization**: All smart contracts are optimized for gas efficiency

### Smart Contract Architecture

#### Commodity Token Contracts (ERC-20)

Each agricultural commodity is represented by an ERC-20 token with additional functionality:

- **Supported Commodities**:
  - Coffee-Robusta
  - Coffee-Arabica
  - Cocoa
  - Sesame
  - Sunflower

- **Key Functions**:
  - `restrictedMint()`: Mints new tokens with role-based access control
  - `burn()`: Burns tokens with verification checks
  - `compliantTransfer()`: Transfers tokens with regulatory checks
  - `validateQuality()`: Updates quality score using oracle data
  - `updatePrice()`: Updates price with Chainlink integration
  - `emergencyPause()`: Pauses contract operations in emergencies

#### Trading Engine Contract

Handles order matching and settlement:

- **Key Features**:
  - Gas-optimized order matching algorithm
  - Automated settlement processing
  - Real-time price feed integration
  - Multi-signature authorization
  - Circuit breaker mechanisms

## Development Setup

### Prerequisites

- Node.js v16+
- Hardhat
- MetaMask or another Ethereum wallet

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the environment variables file:
   ```
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration.

### Compiling Smart Contracts

```
npx hardhat compile
```

### Testing Smart Contracts

```
npx hardhat test
```

### Deploying Smart Contracts

1. To deploy to a local Hardhat network:
   ```
   npx hardhat run scripts/deploy.ts --network localhost
   ```

2. To deploy to Polygon testnet (Mumbai):
   ```
   npx hardhat run scripts/deploy.ts --network mumbai
   ```

3. To deploy to Polygon mainnet:
   ```
   npx hardhat run scripts/deploy.ts --network polygon
   ```

After deployment, update the contract addresses in your `.env` file.

## Security Considerations

- All smart contracts should be audited by a reputable security firm before mainnet deployment
- Multi-signature wallets should be used for contract administration
- Circuit breakers are implemented to pause trading in case of anomalies
- Regular security assessments should be conducted

## Compliance

The platform includes built-in compliance features:

- KYC/AML integration
- Regulatory reporting capabilities
- Compliant transfer restrictions
- Quality verification mechanisms

## Frontend Integration

The frontend interacts with the blockchain through:

- Web3.js/ethers.js for contract interactions
- MetaMask or WalletConnect for wallet connections
- Real-time updates via events and WebSockets

## Monitoring and Maintenance

- Regular monitoring of contract performance
- Gas optimization reviews
- Security patches as needed
- Oracle data verification

## Future Enhancements

- Cross-chain integration
- Layer 2 optimizations
- Advanced market maker mechanisms
- Enhanced oracle integrations
- Additional commodity types
