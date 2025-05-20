# Fotis Agro Trading Platform - Backend

This is the backend server for the Fotis Agro Trading Platform, a blockchain-based agricultural commodities trading platform.

## Architecture

The backend is built with the following technologies:

- **Node.js** with **TypeScript** for type safety
- **Express.js** for the API server
- **Prisma** for database ORM
- **PostgreSQL** for persistent storage
- **Ethers.js** for blockchain interactions
- **JWT** for authentication
- **Winston** for logging

## Features

- User authentication and authorization
- Commodity management and tokenization
- Trading engine with order matching
- Blockchain integration with Ethereum/Polygon
- Market data and price feeds
- KYC/AML compliance

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- Ethereum wallet with MATIC tokens (for Polygon network)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd server
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration.

4. Run database migrations:

```bash
npm run migrate
```

5. Seed the database (optional):

```bash
npm run seed
```

6. Start the development server:

```bash
npm run dev
```

## API Documentation

The API is organized around REST principles. It accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes.

### Base URL

```
http://localhost:5000/api
```

### Authentication

Most endpoints require authentication. To authenticate, include a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN
```

You can obtain a token by calling the `/api/users/login` endpoint.

### API Endpoints

#### User Management

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get token
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/kyc` - Submit KYC information
- `GET /api/users/wallet` - Get user wallet
- `POST /api/users/wallet/add-funds` - Add funds to wallet
- `POST /api/users/wallet/withdraw` - Withdraw funds from wallet

#### Commodity Management

- `POST /api/commodities` - Create a new commodity
- `GET /api/commodities/user/commodities` - Get user's commodities
- `GET /api/commodities/:id` - Get commodity details
- `PUT /api/commodities/:id` - Update commodity
- `POST /api/commodities/:commodityId/inspection` - Request inspection
- `POST /api/commodities/:commodityId/tokenize` - Tokenize commodity
- `POST /api/commodities/:commodityId/list` - List commodity for sale
- `GET /api/commodities/available` - Get available commodities
- `POST /api/commodities/buy/:orderId` - Buy a commodity

#### Order Management

- `POST /api/orders` - Create a new order
- `GET /api/orders/user/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/cancel` - Cancel an order
- `GET /api/orders/book/:commodityType` - Get order book

#### Market Data

- `GET /api/market` - Get market data for all commodities
- `GET /api/market/:commodityType` - Get market data for a specific commodity

#### Blockchain

- `POST /api/blockchain/wallet` - Create a blockchain wallet
- `GET /api/blockchain/balance/:commodityType` - Get token balance
- `GET /api/blockchain/orders` - Get blockchain orders
- `GET /api/blockchain/market/:commodityType` - Get blockchain market data

## Blockchain Integration

The backend integrates with the Ethereum blockchain through the Polygon L2 scaling solution. It uses smart contracts for:

1. **Commodity Tokenization**: Converting physical commodities into ERC-20 tokens
2. **Trading Engine**: Handling order matching and settlement
3. **Price Feeds**: Getting real-time price data from Chainlink oracles

## Database Schema

The database schema is defined using Prisma and includes the following main models:

- User
- Wallet
- BlockchainWallet
- KycStatus
- Commodity
- Inspection
- Order
- Transaction
- MarketData

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
