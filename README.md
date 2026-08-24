# AI Video & Image Generator

A full-stack AI media generation platform that allows users to generate images and videos using multiple AI models from a single interface.

The application combines a modern **React / Next.js frontend** with AI generation APIs, Supabase-backed authentication and data storage, Stripe subscription payments, and a modular monorepo architecture.


## Features

* Generate AI images from text prompts
* Generate AI video using supported AI models
* Select between multiple generation models
* Prompt-based generation workflow
* Save generated media
* Favorite generated images
* Browse previously generated content
* User authentication
* Protected user routes
* Subscription plan management
* Stripe checkout and payment integration
* User settings and account controls
* Responsive web interface

## AI Integrations

The project is designed to work with multiple AI providers and generation services, including:

* OpenAI
* Runway
* Replicate

This architecture allows different AI models to be accessed through one unified interface.

## Tech Stack

### Frontend

* React
* Next.js
* TypeScript
* Tailwind CSS
* Headless UI
* React Icons

### Backend / Infrastructure

* Next.js server functionality
* Supabase
* PostgreSQL
* Drizzle ORM

### AI

* OpenAI API
* Runway SDK
* Replicate API

### Authentication & Data

* Supabase Authentication
* Supabase JavaScript SDK
* PostgreSQL

### Payments

* Stripe
* Stripe Elements
* Stripe Checkout

### Development

* Turborepo
* pnpm Workspaces
* TypeScript
* Prettier
* ESLint



## Notable Components

The frontend is divided into reusable components for different parts of the application.

Examples include:

```text
CenterPanel.tsx
PromptInput.tsx
ModelSelectionModal.tsx
ImageGallery.tsx
FavoritesGallery.tsx
FavoritesPage.tsx
SavedImages.tsx
SubscriptionPlans.tsx
PaymentModal.tsx
CheckoutForm.tsx
ProtectedRoute.tsx
SettingsMenu.tsx
```


## Build

Create a production build:

```bash
pnpm build
```

## Type Checking

```bash
pnpm check-types
```

## Formatting

```bash
pnpm format
```

## Main User Flow

A typical generation workflow is:

```text
Sign In
   ↓
Enter Prompt
   ↓
Select AI Model
   ↓
Generate Image / Video
   ↓
View Result
   ↓
Save or Favorite
```

The platform also includes subscription and payment functionality for supporting tiered access to generation features.

## Screenshots

### Generator


## Future Improvements

Potential improvements include:

* Additional AI model integrations
* Improved generation history
* Expanded image and video editing tools
* More advanced prompt controls
* Improved media organization
* Cloud media storage improvements
* Generation queues and progress tracking
* Additional subscription tiers
* Usage analytics and generation statistics




This project demonstrates full-stack development with modern web technologies, third-party AI API integration, authentication, database-backed user data, payment processing, and a scalable monorepo architecture.

