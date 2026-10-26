This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase database setup

Apply the database migrations to the linked Supabase project:

```powershell
supabase link --project-ref <project-ref>
supabase db push
```

The migration creates the organization-scoped personnel, submissions, recruitment,
anonymous evaluation, reporting, notification, and audit tables and enables
row-level security. Evaluation rules and weights must be configured from the
approved DepEd policy for each position; the database does not invent scoring
criteria or make final hiring decisions.

Recruitment administrators can create a hiring position from the Recruitment &
promotion workspace. Each posting includes its organization, recruitment cycle,
position title/item number, policy reference, and application dates. Applicants
can browse positions during their open application period and submit once per
position from the Applications tab. Active organization units must be configured
before administrators can publish positions.

To invite and provision the initial super admin, set `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in the PowerShell session, then run:

```powershell
node .\supabase\scripts\invite-super-admin.mjs
```

The script invites `sdo.8@deped.edu` if no Auth account exists, then calls a
database function that is executable only by the Supabase `service_role`.
The migration also grants the role to this account if it already exists when
the migration runs. Auth credentials are managed separately from migrations;
no password is stored in the repository. Never expose the service-role key in
client-side code.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
