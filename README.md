# Footballer Career Management System

A Next.js application for managing footballer career data with Django backend integration.

## Features

- 🔐 **Authentication** - Secure login with Django backend
- 🔍 **Player Search** - Search and display footballer career information
- ⚙️ **Configuration** - Player settings and deployment configuration
- 🏢 **Admin Integration** - Direct links to Django admin for data management
- 🔗 **N8N Integration** - Webhook integration for data processing

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django REST API
- **Deployment**: Vercel
- **Automation**: N8N workflows

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to Django backend API

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Update `.env.local` with your configuration:
   \`\`\`env
   NEXT_PUBLIC_API_BASE_URL=https://api.extratime.world
   NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.extratime.world/webhook/footballer-career
   NEXT_PUBLIC_ADMIN_BASE_URL=https://api.extratime.world/admin/
   \`\`\`

5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Django API base URL | `https://api.extratime.world` |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | N8N webhook endpoint | `https://n8n.extratime.world/webhook/footballer-career` |
| `NEXT_PUBLIC_ADMIN_BASE_URL` | Django admin base URL | `https://api.extratime.world/admin/` |

## Deployment

This project is automatically deployed to Vercel when changes are pushed to the `main` branch.

### Manual Deployment

\`\`\`bash
npm run build
vercel --prod
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── login-form.tsx    # Authentication form
│   └── user-menu.tsx     # User menu component
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication context
│   ├── config.ts        # Configuration management
│   └── utils.ts         # Utility functions
├── types/               # TypeScript type definitions
│   ├── auth.ts         # Authentication types
│   └── player.ts       # Player data types
└── public/             # Static assets
\`\`\`

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and commit: `git commit -m "Add your feature"`
3. Push to the branch: `git push origin feature/your-feature-name`
4. Create a Pull Request

## License

Private - All rights reserved.
\`\`\`

Add a proper .gitignore:
