# EaseInn - Comprehensive Hotel Management Platform

**Domain:** www.EaseInn.com

This is a comprehensive B2B hotel management platform built as a full-stack web application. The system enables multi-property hotel operations with role-based access control, featuring a React frontend with Node.js/Express backend, PostgreSQL database, and Drizzle ORM for data operations.

The platform provides enterprise-level hotel management functionality including:
- Multi-tenancy support for hotel chains and independent properties
- Role-based authentication (Admin and Hotelier access levels)
- Complete guest lifecycle management (check-in, stay tracking, checkout)
- **Advance booking management for future reservations**
- GST-compliant invoice generation with Indian tax law compliance
- Real-time room inventory and calendar management with booking visibility
- Comprehensive reporting and analytics dashboard
- Landing page with B2B pricing and registration flow
- Responsive design optimized for desktop and tablet usage

## Recent Changes (August 22, 2025)
- **Platform Rebranding**: Updated to EaseInn with new domain www.EaseInn.com
- **SEO-Optimized URL Structure**: Comprehensive URL strategy with best practices
- **Room Capacity Enforcement**: Backend validation prevents exceeding admin-set limits
- **Guest Management**: Fixed view/edit buttons with detailed guest information dialogs
- **Header Layout**: Resolved UI overlap issues with improved responsive design
- **Hotel-User Linking**: Complete integration between admin settings and hotelier interface
- **Razorpay Payment Integration**: Complete payment gateway with subscription billing, booking payments, and secure transaction processing
- **Payment Dashboard**: Modern payments page with subscription plans, payment history, and Razorpay checkout integration

## Previous Changes (August 21, 2025)
- **Advance Bookings System**: Complete booking management for future reservations
- **Enhanced Calendar**: Shows both current check-ins (green) and advance bookings (blue)
- **Improved Input Handling**: Fixed numeric input field behavior across all forms
- **Dynamic Pricing**: Room rates stored per booking for accurate billing

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 and TypeScript, using Vite as the build tool. The UI framework leverages shadcn/ui components built on top of Radix UI primitives, styled with Tailwind CSS. The application uses a file-based routing system with Wouter for navigation.

Key architectural decisions:
- **Component Library**: shadcn/ui provides a consistent, accessible component system with dark mode support
- **State Management**: TanStack Query handles server state management and caching, eliminating need for complex global state
- **Form Handling**: React Hook Form with Zod validation ensures type-safe form processing
- **Styling**: Tailwind CSS with CSS variables enables consistent theming and responsive design

## Backend Architecture
The server uses Express.js with TypeScript, following a modular route-based architecture. The storage layer implements a repository pattern through the `IStorage` interface, abstracting database operations.

Core architectural patterns:
- **Database Layer**: Drizzle ORM provides type-safe database queries with PostgreSQL
- **Data Modeling**: Zod schemas shared between client and server ensure consistent validation
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling
- **Middleware**: Request logging, JSON parsing, and error handling middleware

## Data Storage Architecture
PostgreSQL database with Drizzle ORM manages four main entities:
- **Users**: Basic authentication (currently simplified)
- **Rooms**: Room inventory with type and status tracking
- **Guests**: Comprehensive guest information including demographics and digital signatures
- **Check-ins**: Links guests to rooms with temporal data

Database design emphasizes:
- **Referential Integrity**: Foreign key constraints maintain data consistency
- **Enumerated Types**: PostgreSQL enums for room status, type, and visit purpose
- **Temporal Tracking**: Created timestamps for audit trails
- **Flexible Schema**: Text fields for addresses and signatures accommodate varying data formats

## Authentication and Authorization
Currently implements basic user structure without full authentication flow. The system is designed for single-property use with hotel staff access.

Future considerations:
- Session management with connect-pg-simple
- Role-based access control for different staff levels
- Integration with hotel management systems

# External Dependencies

## Database Infrastructure
- **Neon Database**: Serverless PostgreSQL database with WebSocket support for real-time connections
- **Drizzle Kit**: Database migration and schema management tools

## UI and Styling
- **Radix UI**: Headless component primitives for accessibility and consistency
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Font Awesome**: Additional icons for hotel-specific UI elements

## Development and Build Tools
- **Vite**: Fast build tool with TypeScript and React support
- **Replit Integration**: Development environment with runtime error overlay and cartographer
- **ESBuild**: Fast bundling for production server builds

## Form and Data Validation
- **Zod**: Runtime type validation shared between client and server
- **React Hook Form**: Performant form library with validation integration
- **Date-fns**: Date manipulation utilities for check-in/out handling

## State Management and API
- **TanStack Query**: Server state management with caching and synchronization
- **Wouter**: Lightweight routing library for single-page application navigation

## Signature Capture
- **HTML5 Canvas**: Custom signature pad implementation for touch and mouse input
- **Base64 Encoding**: Digital signature storage as encoded image data