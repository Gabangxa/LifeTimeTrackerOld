# Life Activity Visualizer

## Overview

Life Activity Visualizer is a comprehensive web application that provides intelligent, real-time insights into personal time allocation. It enables users to visualize their lifetime productivity through interactive charts, life grids, and personalized health optimization recommendations. The application integrates real-world data from the World Bank API to provide accurate life expectancy calculations and offers dynamic projections based on user activities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development
- **Component Library**: shadcn/ui built on Radix UI primitives for accessible, customizable components
- **Styling**: TailwindCSS with custom theme support and dark/light mode switching
- **Animation**: Framer Motion for smooth transitions and visual enhancements
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for robust input validation
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Express.js** server with TypeScript
- **Database**: Drizzle ORM with PostgreSQL (configurable via Drizzle config)
- **External APIs**: World Bank API integration for life expectancy data
- **Storage**: In-memory storage with extensible interface for database integration

## Key Components

### Data Models
- **User Management**: Basic user authentication and profile storage
- **Country Life Expectancy**: Cached World Bank data for performance
- **UserLifeData**: Stores user profiles, birthdates, activities, and visualization preferences

### Frontend Components
- **LifeVisualizer**: Main application dashboard with interactive charts
- **Activity Management**: Dynamic activity creation and customization
- **Visualization Components**: Life grid, pie charts, bar charts using Chart.js
- **Health Optimization**: Sleep analysis, exercise recommendations, health scoring
- **Theme System**: Persistent dark/light mode with custom color schemes

### Backend Services
- **World Bank API Service**: Fetches and caches country life expectancy data
- **Health Calculations**: Custom algorithms for health optimization and projections
- **Data Persistence**: Extensible storage interface (currently in-memory)

## Data Flow

1. **User Input**: Users enter birthdate, country, and daily activities
2. **External Data Fetching**: Application retrieves life expectancy data from World Bank API
3. **Calculation Engine**: Custom algorithms process activity data and generate insights
4. **Visualization Rendering**: Chart.js renders interactive visualizations
5. **Real-time Updates**: Timeline slider dynamically recalculates all metrics
6. **Data Persistence**: User data stored via Drizzle ORM (future database integration)

## External Dependencies

### APIs
- **World Bank API**: Life expectancy data by country
- **Google Analytics**: User behavior tracking (gtag.js)

### Key Libraries
- **Chart.js**: Data visualization and interactive charts
- **html2canvas**: Image export functionality for sharing
- **axios**: HTTP client for API requests
- **date-fns**: Date manipulation and formatting
- **uuid**: Unique identifier generation

### Development Tools
- **Vite**: Build tool with HMR and optimized bundling
- **ESBuild**: Fast TypeScript compilation for production
- **PostCSS**: CSS processing with Tailwind integration

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Type Checking**: TypeScript compilation validates all code

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable
- **API Keys**: Configurable external service credentials
- **Security**: Content Security Policy headers for XSS protection

### Production Optimizations
- **Code Splitting**: Vite automatically splits code for optimal loading
- **Static Assets**: Efficient serving of fonts, icons, and images
- **Caching**: TanStack Query provides intelligent data caching
- **SEO**: Complete meta tags, sitemap, and robots.txt for search engines

### Security Measures
- **CSP Headers**: Comprehensive Content Security Policy
- **Input Validation**: Zod schemas validate all user inputs
- **XSS Protection**: Built-in browser security headers
- **HTTPS**: Force secure connections in production

The architecture supports future enhancements including user authentication, data persistence, and advanced analytics while maintaining clean separation of concerns and type safety throughout the application.