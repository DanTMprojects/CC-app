# TradeTalk Pro

A comprehensive construction project management application with CompanyCam integration for seamless photo organization and sharing.

## Features

- **Project Management**: Create, track, and manage construction projects with full lifecycle support
- **CompanyCam Integration**: Sync photos from CompanyCam, link projects, and share photos seamlessly
- **Photo Gallery**: View, organize, and manage project photos with lightbox support
- **Task Management**: Track project tasks with priorities, statuses, and assignments
- **Invoice Generation**: Create professional invoices with line items and tax calculations
- **Expense Tracking**: Monitor project costs by category with billable marking
- **Time Tracking**: Log worker hours with overtime and break tracking
- **Daily Logs**: Document daily progress with weather, worker counts, and issues
- **Contact Management**: Organize clients, subcontractors, suppliers, and other contacts

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Zustand** - State management with persistence
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide Icons** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### CompanyCam Setup

1. Go to Settings in the app
2. Enter your CompanyCam API key (get it from [CompanyCam Settings](https://app.companycam.com/settings/integrations))
3. Click "Test Connection" to verify
4. Click "Sync Projects" to import your CompanyCam projects
5. Link your TradeTalk projects to CompanyCam projects to sync photos

## Project Structure

```
src/
├── components/
│   ├── layout/          # App layout components
│   └── ui/              # Reusable UI components (shadcn/ui)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Page components
├── services/            # API services (CompanyCam)
└── store/               # Zustand store
```

## CompanyCam API Integration

The app integrates with CompanyCam's REST API v2:

- **Projects**: List, create, update, delete projects
- **Photos**: List, upload, update project photos
- **Tags**: Manage photo tags
- **Comments**: Add comments to photos

API documentation: https://docs.companycam.com

## Data Storage

All data is stored locally in the browser using localStorage via Zustand's persist middleware. This includes:

- Projects and their photos
- Tasks, invoices, expenses
- Time entries and daily logs
- Contacts and settings
- CompanyCam sync state

You can export/import your data or clear all data from Settings.

## License

MIT
