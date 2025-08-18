# Overview

This is a hotel check-in management system built as a full-stack web application. The system enables hotel staff to manage guest check-ins, track room availability in real-time, and maintain comprehensive guest records. It features a React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and Drizzle ORM for database operations.

The application provides core hotel management functionality including:
- Guest check-in forms with comprehensive data capture (personal details, signature, room assignment)
- Real-time room inventory dashboard with visual status indicators
- Guest management and search capabilities
- Basic reporting functionality
- Responsive design optimized for both desktop and tablet usage

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