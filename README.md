# Darbco ERP - Inventory & Procurement Management System

A comprehensive inventory and procurement management system designed for manufacturing operations in Jordan with full Arabic/English support and Jordan VAT compliance.

## Features

### Core Functionality
- **Procurement Workflow**: RFQ → Quote Comparison → Purchase Order → Approval → Receipt
- **Inventory Management**: Material Issue (MIN), Material Return (MRN), Transfers, Adjustments
- **Production Planning**: BOM Designer, Work Orders, Component Reservation, Backflush
- **Real-time Dashboards**: Operations Cockpit, Procurement Pipeline, Item 360, Supplier Scorecards
- **Barcode/QR Scanning**: Mobile-optimized warehouse operations
- **Daily Transaction Record (DTR)**: Unified ledger for all stock movements

### Advanced Features
- **Multi-language Support**: English/Arabic with RTL layout
- **Role-based Access Control**: Admin, Procurement, Storekeeper, Production, Finance
- **Row-level Data Scoping**: Warehouse, department, supplier restrictions
- **Jordan VAT Compliance**: 16% VAT calculations and multi-currency support
- **PDF Generation**: All vouchers with bilingual headers and QR codes
- **CSV Import/Export**: Bulk operations with validation and error reporting

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- TanStack Query for state management
- Wouter for routing
- i18next for internationalization

### Backend
- Node.js with Express
- PostgreSQL with Drizzle ORM
- JWT authentication via Replit Auth
- Zod for validation
- File upload support

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Environment variables configured

### Environment Variables
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-session-secret
REPLIT_DOMAINS=your-domain.com
