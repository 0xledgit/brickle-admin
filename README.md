# Brickle Admin

A simple Next.js 15 administration interface for managing Brickle Platform Leasings and Campaigns.

## Features

### 🔧 Admin Configuration
- **API Key Management**: Secure storage of API authentication key
- **Owner Email Setup**: Configure the owner email for request headers
- **Base URL Configuration**: Set the API endpoint URL
- **Admin User ID**: Required for file uploads as entity ID
- **Auto-Generated Headers**: Automatically generates `correlationId`, `source`, and `requestDate`

### 🏢 Leasing Management
- **Create/Update Leasings** with all required fields:
  - Basic info: Name, Type, Quantity, Price
  - Token info: Tokens, Tokens Available, Price per Token
  - Contract details: Address, Time, TIR
  - Liquidity levels and descriptions
- **File Upload Support**:
  - Cover images: `Leasing.Cover.{extension}`
  - Miniature images: `Leasing.Miniature.{extension}`
  - Built-in naming validation and guidance
- **Enum Support**: 
  - Leasing Types: Maquinaria, Electronicos, Vehiculos, etc.
  - Liquidity Levels: Low, Medium, High

### 📊 Campaign Management  
- **Create Campaigns** linked to existing leasings
- **Leasing Selection**: Dropdown with available active leasings
- **Campaign Data**: Min/Max capital, base token, Brickle address, status
- **Leasing Agreement Data**: Complete agreement details with 20+ fields
- **Comprehensive Form**: Asset values, terms, rates, insurance, risk levels
- **Lessee Selection**: Requires customer (lessee) user ID for agreements
- **Data Validation**: Proper numeric conversion and validation

## Technical Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API calls
- **UUID** for correlation ID generation

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

## API Integration

The application integrates with the Brickle Platform API using the following endpoints:

### Leasing Controller (`/api/Leasing`)
- `GET /` - Get all leasings
- `GET /{id}` - Get leasing by ID
- `POST /` - Create new leasing
- `PUT /{id}` - Update leasing
- `DELETE /{id}` - Delete leasing

### Campaign Controller (`/api/Campaign`)  
- `POST /` - Create new campaign
- `GET /{id}` - Get campaign by ID

### File Controller (`/api/File`)
- `POST /` - Upload file
- `GET /{entityType}/{entityId}/{fileType?}` - Get file URL

## File Upload Requirements

Files must follow the naming convention: `{Entity}.{PropertyName}.{Extension}`

**Examples**:
- `Leasing.Cover.png`
- `Leasing.Miniature.jpg`

**Supported formats**: JPG, PNG, GIF, BMP, WebP (max 10MB)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Main layout with header
│   └── page.tsx            # Home page with admin interface
├── components/
│   ├── AdminSetup.tsx      # API configuration component
│   ├── LeasingForm.tsx     # Leasing create/edit form
│   ├── CampaignForm.tsx    # Campaign create form
│   └── FileUpload.tsx      # File upload with validation
├── lib/
│   ├── types.ts            # TypeScript type definitions
│   └── api.ts              # API client class
└── utils/
    └── headers.ts          # Header generation utilities
```

## Notes

- This is a simple, functional admin interface focused on practical operations
- No complex UI/UX - designed for admin efficiency
- All API calls include proper authentication and correlation tracking
- File uploads validate naming conventions and provide clear guidance
- Forms include comprehensive validation and error handling
- Campaign form requires manual entry of lessee user ID (future enhancement: user lookup/dropdown)
