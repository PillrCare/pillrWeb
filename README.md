<h1 align="center">Pillr</h1>

<p align="center">
  A medication adherence monitoring application using IoT devices
</p>

<p align="center">
  <a href="#overview"><strong>Overview</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#user-roles"><strong>User Roles</strong></a> ·
  <a href="#development"><strong>Development</strong></a>
</p>
<br/>

## Overview

Pillr connects patients with caregivers and agencies to track medication schedules and device interactions. Using IoT devices with biometric security and weight-based verification, Pillr ensures medication adherence while providing real-time monitoring and alerts to caregivers.

## Features

### Core Functionality

- **Biometric Security**: Integrated fingerprint scanner ensures only authorized individuals access medications
- **Weight-Based Verification**: High-precision load cells detect when medication is actually removed, preventing false confirmations
- **Real-Time Alerts**: Instant notifications to caregivers when doses are missed or taken
- **Medication Scheduling**: Configure weekly medication schedules with specific dose times
- **Multi-User Monitoring**: Caregivers can monitor multiple patients across their dashboard

### IoT Device Integration

- **Device Enrollment**: Pair IoT devices with patient accounts using connection codes
- **Device Commands**: Send commands to devices (enroll, emergency unlock, clear)
- **Activity Logging**: Track all device interactions including searches, enrollments, and opens
- **Next Event Tracking**: Automatic calculation of upcoming medication times

### User Management

- **Role-Based Access**: Three distinct user types (Patient, Caregiver, Manager)
- **Agency Support**: Multi-tenant architecture supporting multiple agencies
- **Caregiver-Patient Connections**: Secure pairing system using temporary connection codes

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL with Row Level Security)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) with [shadcn/ui](https://ui.shadcn.com/) components
- **Email**: [Resend](https://resend.com) for transactional emails
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) for dark/light mode

## User Roles

The application supports three distinct user types:

### Patient
- View their own medication schedule
- Connect with caregivers using connection codes
- Claim and manage IoT devices
- View their medication history and device logs
- Dashboard: `/dashboard/patient`

### Caregiver
- Monitor multiple patients
- View medication schedules for all assigned patients
- Receive alerts when patients miss medications
- Generate connection codes to pair with patients
- Dashboard: `/dashboard/caregiver`

### Manager (Agency)
- Manage agency-wide operations
- Oversee multiple caregivers and patients
- View analytics and reports
- Dashboard: `/dashboard/admin`

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A [Supabase](https://supabase.com) account and project
- [Resend](https://resend.com) API key (optional, for email functionality)

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/IsNielsen/pillr.git
   cd pillr
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and update with your values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   RESEND_API_KEY=your-resend-api-key
   CONTACT_EMAIL=your-contact-email
   RESEND_FROM_EMAIL=your-from-email
   ```

   Find your Supabase credentials in your [project's API settings](https://supabase.com/dashboard/project/_/settings/api).

4. **Set up the database**

   See [SCHEMA.md](./SCHEMA.md) for the database schema. You'll need to create the tables and functions in your Supabase project.

5. **Run the development server**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

## Development

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Project Structure

```
app/                 # Next.js App Router pages
├── auth/           # Authentication pages (sign-in, sign-up)
├── dashboard/      # Role-specific dashboards
│   ├── patient/    # Patient dashboard
│   ├── caregiver/  # Caregiver dashboard
│   └── admin/      # Manager/agency dashboard
├── claim-device/   # Device claiming flow
└── contact/        # Contact form

components/         # Reusable React components
lib/               # Utility functions and Supabase clients
```

### Database Architecture

Pillr uses Supabase (PostgreSQL) with Row Level Security (RLS) policies to ensure data privacy:

- **profiles**: User data with role and agency assignment
- **weekly_events**: Medication schedules
- **medications**: Medication details linked to schedules
- **device_commands**: Commands sent to IoT devices
- **device_log**: Device activity history
- **caregiver_patient**: Caregiver-patient relationships
- **connection_codes**: Temporary pairing codes

See [SCHEMA.md](./SCHEMA.md) for detailed schema information.

### Key Implementation Details

- **Timezone Handling**: All times stored in UTC, converted to local time for display
- **Authentication**: Cookie-based SSR auth with Supabase
- **Client Pattern**: Separate browser and server clients (see `lib/supabase/`)
- **Dashboard Routing**: Automatic redirect based on user type

For more development guidance, see [CLAUDE.md](./CLAUDE.md).

## Deployment

### Deploy to Vercel

The easiest way to deploy Pillr is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel's project settings
4. Deploy

Vercel will automatically build and deploy your application. Make sure to set up all required environment variables in your Vercel project settings.

### Database Setup

Before deploying, ensure your Supabase database is properly configured:

1. Create all required tables (see [SCHEMA.md](./SCHEMA.md))
2. Set up Row Level Security policies
3. Create necessary database functions
4. Enable Realtime if needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is part of a medication adherence monitoring system developed for healthcare applications.

## Support

For questions or support, use the contact form at `/contact` or reach out to the development team.
