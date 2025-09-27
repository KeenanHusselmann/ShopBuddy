# Shop Buddy Setup Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to [http://localhost:8080](http://localhost:8080)

## Database Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/` in order
3. Set up Row Level Security (RLS) policies
4. Configure authentication settings

## Available Scripts

- `npm run dev` - Development server (port 8080)
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # UI components (shadcn/ui)
├── pages/         # Application pages
├── hooks/         # Custom React hooks
├── integrations/  # Supabase client
├── lib/          # Utility functions
├── types/        # TypeScript definitions
└── utils/        # Helper functions
```

## Troubleshooting

- **Build errors**: Run `npm run build` to see detailed error messages
- **TypeScript errors**: Run `npx tsc --noEmit` to check types
- **Linting issues**: Run `npm run lint` to see ESLint warnings
