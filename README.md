# Brickle Admin Platform

**A comprehensive Web3-enabled administration interface for the Brickle tokenized asset leasing platform**

Built with Next.js 15, this admin platform provides complete management capabilities for tokenized asset leasing operations, integrating blockchain technology with traditional financial instruments through the Brickle API ecosystem.

## Core Administrative Functionalities

### 🔧 Platform Configuration & Security
- **API Key Management**: Secure Bearer token authentication for all Brickle API communications
- **Owner Email Configuration**: User identification for audit trails and request tracking
- **Environment Configuration**: Configurable API endpoints (default: `https://localhost:7001`, production: `apiqa.brickle.app`)
- **Admin User Management**: Centralized admin user ID for secure file operations and entity management
- **Auto-Generated Headers**: UUID-based correlation IDs, source tracking, and ISO timestamp generation for comprehensive request tracing

### 🏢 Tokenized Asset Leasing Management
- **Asset Creation & Management**: Complete lifecycle management of tokenizable assets with:
  - Asset categorization (Maquinaria, Electronicos, Vehiculos, Tecnologia, Energia, Salud, Mobiliario, Agricultura)
  - Financial parameters (pricing, token allocation, TIR calculations)
  - Smart contract integration with configurable contract addresses
  - Liquidity level classification (Low/Medium/High) for risk assessment
- **Digital Asset Management**: 
  - Standardized file upload system with enforced naming conventions (`Leasing.Cover.{ext}`, `Leasing.Miniature.{ext}`)
  - Multi-format support (JPG, PNG, GIF, BMP, WebP) with 10MB size limits
  - Entity-based file organization for scalable asset management
- **Tokenization Parameters**: 
  - Token supply management and allocation tracking
  - Price-per-token calculations and availability monitoring
  - Smart contract time-lock and term configuration

### 📊 Web3 Campaign & Investment Management
- **Campaign Orchestration**: End-to-end management of tokenized investment campaigns with:
  - Multi-asset campaign creation linked to existing tokenized leasings
  - Dynamic capital range configuration (minimum/maximum investment thresholds)
  - ERC-20 base token selection and blockchain address management
  - Campaign status management (Active/Inactive/Completed) with automated state transitions
- **Smart Contract Integration**: 
  - Campaign finalization through on-chain contract calls
  - Threshold factory contract interaction for campaign completion
  - Automated blockchain transaction processing with error handling
- **Investor Agreement Processing**: Comprehensive leasing agreement generation with:
  - 20+ configurable financial parameters (asset values, terms, rates, insurance levels)
  - Risk assessment integration (risk levels, risk rates, IBR calculations)
  - Multi-currency support and tax calculation (IVA integration)
  - Customer (lessee) assignment with user lookup functionality

### 💳 Web3 Payment Processing & DeFi Integration
- **ERC-20 Token Payment Processing**: Native support for blockchain-based payments with:
  - Ethers.js integration for Web3 wallet connectivity
  - EIP-2612 permit signature generation for gasless transactions
  - Multi-network support (Polygon Amoy testnet, configurable for production networks)
  - Automated signature verification and transaction relaying
- **DeFi Payment Infrastructure**:
  - Smart contract interaction for payment processing
  - Relayer fee calculation and management
  - Deadline-based payment authorization for security
  - Private key management for administrative operations

## Technology Architecture & Implementation

### 🏗️ Frontend Architecture
- **Next.js 15** with App Router - Modern React framework with server-side rendering capabilities
- **TypeScript** - Complete type safety across all components and API interactions
- **Tailwind CSS v4** - Utility-first styling with responsive design patterns
- **React Hook Form** - Advanced form management with validation and error handling

### 🔗 Web3 & Blockchain Integration
- **Ethers.js v6** - Complete Ethereum blockchain interaction library for:
  - Smart contract communication and transaction processing
  - EIP-2612 permit signature generation for gasless token transfers
  - Multi-network support (Polygon Amoy, configurable for mainnet)
  - Private key management and wallet functionality
- **ERC-20 Token Standard** - Native support for token-based payments and transfers

### 🌐 API & Data Management
- **Axios** - HTTP client with interceptor support for:
  - Automated header injection (correlation IDs, authentication, timestamps)
  - Error handling and retry logic
  - RESTful API communication with Brickle backend
- **UUID v4** - Cryptographically secure correlation ID generation for request tracking

### 🗄️ Backend Integration Points
- **Brickle API Ecosystem** (`apiqa.brickle.app`) - Comprehensive REST API integration covering:
  - Leasing Controller (`/api/Leasing`) - CRUD operations for tokenized assets
  - Campaign Controller (`/api/Campaign`) - Investment campaign management and finalization
  - File Controller (`/api/File`) - Digital asset storage and retrieval
  - User Controller (`/api/User`) - Customer and lessee management with search capabilities
  - Payment Controller (`/api/Payment`) - Web3 payment processing and transaction handling

## Getting Started

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

3. **Configure Admin Settings**:
   - Enter your API key
   - Set owner email
   - Set admin user ID (used for file uploads)
   - Configure base URL (default: `https://localhost:7001`)

4. **Start Managing**:
   - Click "Create Leasing" to add new leasings with images
   - Click "Create Campaign" to create campaigns for existing leasings

## Brickle API Integration & Endpoints

### 🔗 Authentication & Security
All API requests implement:
- **Bearer Token Authentication** - Secure API key-based authorization
- **Correlation Tracking** - UUID-based request correlation for debugging and audit trails
- **Request Metadata** - Automated injection of user, source, and timestamp headers
- **Error Handling** - Comprehensive error processing with user-friendly messaging

### 📋 Core API Endpoints

#### Leasing Management (`/api/Leasing`)
- `GET /` - Retrieve all tokenized leasings with pagination support
- `GET /{id}` - Get specific leasing details including token allocation status
- `POST /` - Create new tokenized leasing with smart contract integration
- `PUT /{id}` - Update existing leasing parameters and token availability
- `DELETE /{id}` - Soft delete leasing (maintains audit trail)

#### Campaign Operations (`/api/Campaign`)  
- `GET /` - List all investment campaigns with status filtering
- `POST /` - Create tokenized investment campaign with leasing agreement data
- `GET /{id}` - Retrieve campaign details including investor participation
- `POST /{campaignAddress}/finalize` - Execute smart contract finalization

#### File & Digital Asset Management (`/api/File`)
- `POST /` - Upload digital assets with entity-based organization
- `GET /{entityType}/{entityId}/{fileType?}` - Retrieve file URLs with CDN support

#### User & Customer Management (`/api/User`)
- `GET /search` - Search users/lessees with autocomplete functionality
- Support for customer onboarding and KYC integration

#### Web3 Payment Processing (`/api/Payment`)
- `POST /` - Process ERC-20 token payments with permit signatures
- Integration with DeFi protocols for automated payment handling

#### Leasing Agreement Management (`/api/UserLeasingAgreement`)
- `GET /leasing/{leasingId}` - Retrieve all agreements for specific leasing
- Support for comprehensive agreement lifecycle management

## File Upload Requirements

Files must follow the naming convention: `{Entity}.{PropertyName}.{Extension}`

**Examples**:
- `Leasing.Cover.png`
- `Leasing.Miniature.jpg`

**Supported formats**: JPG, PNG, GIF, BMP, WebP (max 10MB)

## Platform Architecture & Project Structure

### 🏛️ Application Architecture
The Brickle Admin platform follows a modular, component-based architecture designed for scalability and maintainability in Web3 environments:

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Global layout with navigation
│   └── page.tsx                 # Main dashboard with action controls
├── components/                   # React component library
│   ├── AdminSetup.tsx           # Platform configuration interface
│   ├── LeasingForm.tsx          # Tokenized asset creation/management
│   ├── CampaignForm.tsx         # Investment campaign orchestration
│   ├── FinalizeCampaignForm.tsx # Smart contract finalization interface
│   ├── PaymentForm.tsx          # Web3 payment processing with Ethers.js
│   ├── FileUpload.tsx           # Digital asset management with validation
│   └── UserAutocomplete.tsx     # User search and selection
├── lib/                         # Core business logic
│   ├── types.ts                 # TypeScript definitions for all DTOs and interfaces
│   └── api.ts                   # Centralized API client with authentication
└── utils/
    └── headers.ts               # Request correlation and metadata generation
```

### 🔄 Data Flow Architecture
1. **Configuration Layer**: Admin setup with secure credential management
2. **Business Logic Layer**: API client with automated header injection and error handling
3. **Component Layer**: Reactive UI components with form validation and state management
4. **Integration Layer**: Direct communication with Brickle API ecosystem and blockchain networks

### 🎯 Platform Scope & Capabilities

#### Core Business Functions
- **Asset Tokenization**: Convert physical assets into blockchain-based tokens with fractional ownership
- **Investment Campaign Management**: Orchestrate crowdfunding campaigns for tokenized assets
- **Smart Contract Integration**: Direct interaction with Ethereum-compatible smart contracts
- **Payment Processing**: Native Web3 payment handling with gasless transaction support
- **User Management**: Customer onboarding and lessee management with search capabilities

#### Technical Capabilities
- **Multi-Network Support**: Configurable for various blockchain networks (Polygon, Ethereum)
- **Scalable File Management**: Entity-based digital asset organization with CDN integration
- **Audit Trail**: Complete request tracking with correlation IDs and timestamp logging
- **Error Resilience**: Comprehensive error handling with user-friendly feedback
- **Type Safety**: Full TypeScript implementation across all layers

#### Integration Points
- **Backend API**: `apiqa.brickle.app` - Production-ready REST API
- **Blockchain Networks**: Polygon Amoy (testnet), configurable for production networks
- **Smart Contracts**: Threshold factory pattern for campaign management
- **File Storage**: CDN-integrated asset storage with structured naming conventions

## Platform Value Proposition & Benefits

### 🚀 For Brickle Platform Operations
- **Streamlined Asset Management**: Comprehensive interface for tokenized asset lifecycle management
- **Automated Web3 Integration**: Seamless blockchain interaction without technical complexity
- **Scalable Campaign Management**: End-to-end investment campaign orchestration with smart contract automation
- **Enterprise-Grade Security**: Bearer token authentication with comprehensive audit trails
- **Production-Ready Infrastructure**: Built for high-volume operations with error resilience

### 💼 Business Impact
- **Reduced Operational Overhead**: Automated processes eliminate manual blockchain interactions
- **Enhanced Compliance**: Complete audit trail with correlation tracking for regulatory compliance
- **Improved User Experience**: Simplified interfaces for complex Web3 operations
- **Scalable Architecture**: Designed to handle growth in assets, campaigns, and user volume
- **Risk Management**: Built-in validation and error handling for financial operations

### 🔧 Technical Excellence
- **Type Safety**: Complete TypeScript implementation eliminates runtime errors
- **Modular Design**: Component-based architecture enables easy feature expansion
- **API-First Approach**: Centralized integration with comprehensive error handling
- **Modern Stack**: Latest Next.js, React, and Web3 technologies for optimal performance
- **Developer Experience**: Clean code structure with comprehensive documentation

---

## Deployment & Production Considerations

### 🌐 Environment Configuration
- **Development**: `https://localhost:7001` for local API testing
- **Staging/Production**: `apiqa.brickle.app` for live operations
- **Blockchain Networks**: Configurable for testnet/mainnet deployment

### 🔐 Security Best Practices
- All API keys should be stored securely and rotated regularly
- Private keys for Web3 operations should use hardware security modules in production
- Correlation IDs provide complete request traceability for security audits
- File uploads are validated and size-limited to prevent abuse

### 📈 Scalability Features
- Stateless architecture enables horizontal scaling
- CDN integration for optimal file delivery performance
- Pagination support for large dataset management
- Error handling designed for high-volume operations

This platform represents a complete solution for Web3-enabled asset tokenization and investment management, providing Brickle with the tools needed to scale their tokenized leasing operations efficiently and securely.
