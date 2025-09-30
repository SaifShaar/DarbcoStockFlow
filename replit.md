# Darbco ERP - Inventory & Procurement Management System

## Overview

Darbco ERP is a comprehensive inventory and procurement management system designed specifically for manufacturing operations in Jordan. The system provides complete workflow management from procurement (RFQ → Quote Comparison → Purchase Order → Approval → Receipt) through inventory operations (Material Issue/Return, Transfers, Adjustments) to production planning with BOM design and work orders. The application features full Arabic/English bilingual support with RTL layout capabilities and Jordan VAT compliance (16% VAT calculations).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React 18 with TypeScript, providing a modern single-page application experience. Key architectural decisions include:

**Component Library Strategy**: Uses shadcn/ui components built on Radix UI primitives for consistent, accessible UI components. This provides a comprehensive design system while maintaining flexibility for customization.

**State Management**: Implements TanStack Query (React Query) for server state management, which handles caching, synchronization, and background updates automatically. Local component state is managed with React hooks.

**Routing**: Uses Wouter as a lightweight client-side router, chosen for its minimal footprint and simple API compared to React Router.

**Internationalization**: Custom i18n implementation using React Context with JSON translation files for English and Arabic support, including RTL layout switching.

**Styling**: Tailwind CSS with CSS custom properties for theming, allowing for consistent design tokens and dark/light mode support.

### Backend Architecture
The backend follows a Node.js/Express architecture with the following key components:

**API Structure**: RESTful API design with standardized response format `{ success: boolean, message: string, data: object | null }` for consistent error handling and client-side processing.

**Database Layer**: Uses Drizzle ORM with PostgreSQL, providing type-safe database operations and automatic TypeScript type generation from schema definitions.

**Authentication**: Replit Auth integration with JWT tokens and session management using connect-pg-simple for PostgreSQL-backed sessions.

**Authorization**: Role-based access control (RBAC) with row-level security scoping by warehouse, department, and supplier for data isolation.

### Data Storage Solutions
**Primary Database**: PostgreSQL chosen for ACID compliance, complex queries, and robust transaction support needed for inventory and financial operations.

**Schema Design**: Comprehensive relational schema covering:
- User management with role-based permissions
- Master data (items, suppliers, warehouses, bins)
- Procurement workflow (RFQs, quotes, purchase orders, GRNs)
- Inventory operations (material issue/return, transfers, adjustments)
- Production planning (BOMs, work orders)
- Daily Transaction Record (DTR) for unified stock movement tracking

**Session Storage**: PostgreSQL-backed sessions for scalability and persistence across server restarts.

### Authentication and Authorization
**Authentication Provider**: Replit Auth using OpenID Connect for secure user authentication with automatic user provisioning.

**Session Management**: Server-side sessions stored in PostgreSQL with configurable TTL and secure cookie handling.

**Authorization Model**: 
- Role-based permissions (Admin, Procurement, Storekeeper, Production, Finance)
- Row-level data scoping to restrict access by warehouse, department, or supplier
- API middleware for route protection and permission enforcement

### Mobile and Scanning Support
**Progressive Web App Features**: Mobile-optimized interface with barcode/QR code scanning capabilities for warehouse operations.

**Responsive Design**: Mobile-first responsive design with touch-friendly interfaces for scanning workflows.

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling optimized for serverless environments
- **drizzle-orm**: Type-safe ORM for PostgreSQL with automatic schema validation
- **@tanstack/react-query**: Server state management with caching and synchronization
- **wouter**: Lightweight client-side routing for React

### UI and Design System
- **@radix-ui/react-***: Comprehensive suite of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe variant API for component styling
- **cmdk**: Command palette component for advanced search functionality

### Authentication and Security
- **openid-client**: OpenID Connect client for Replit Auth integration
- **passport**: Authentication middleware with strategy support
- **express-session**: Session middleware with PostgreSQL storage
- **connect-pg-simple**: PostgreSQL session store adapter

### Development and Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **esbuild**: Fast JavaScript bundler for production builds
- **drizzle-kit**: Database migration and introspection tools

### Validation and Forms
- **zod**: Runtime type validation for API requests and responses
- **@hookform/resolvers**: Integration between React Hook Form and Zod
- **react-hook-form**: Performant forms with minimal re-renders

### Internationalization
- **date-fns**: Comprehensive date manipulation library with locale support
- Custom i18n implementation with JSON translation files for Arabic/English support

### PDF and File Processing
- **jspdf**: Client-side PDF generation for vouchers and reports (planned integration)
- File upload support through Express middleware for CSV import/export functionality

### Jordan-Specific Requirements
- **Jordan VAT Compliance**: 16% VAT calculation support with multi-currency handling
- **Arabic Language Support**: Full RTL layout and Arabic text rendering
- **Local Business Workflows**: Procurement and inventory processes aligned with Jordan manufacturing practices