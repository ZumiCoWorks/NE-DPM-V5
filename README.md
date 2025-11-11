# NE DPM V5 - Digital Platform Manager

This repository contains the `dpm-web` application, which serves as the Admin and Sponsor Hub for the NavEaze Digital Platform Manager.

## Project Overview

The NavEaze Digital Platform Manager (DPM) is a comprehensive solution for managing live events. It provides tools for event administrators to set up and manage event floorplans, vendors, and sponsors. It also provides a dedicated dashboard for sponsors to track their return on investment (ROI).

This `dpm-web` project is the central web application for all non-attendee users.

### Current Status: MVP Complete

The Minimum Viable Product (MVP) is complete and implements the core user flows for Event Admins and Sponsors.

- **Admin Flow:** Admins can log in, create new events, upload and edit floorplan maps, manage vendor and sponsor placements, and generate unique signup links for vendors.
- **Sponsor/Vendor Flow:** Vendors or sponsors can use a unique link to sign up and create an account, which is automatically associated with the correct event.
- **Sponsor ROI:** Sponsors can log in to view a dedicated dashboard that displays key ROI metrics.

## Technology Stack

- **Frontend:** React, Vite, TypeScript
- **Styling:** TailwindCSS, ShadCN/UI
- **Backend & Database:** Supabase (Auth, Postgres, Storage, RPCs)
- **Map & Canvas:** `react-konva`
- **Routing:** `react-router-dom`

## Getting Started

### Prerequisites

- Node.js (v18+ recommended) and npm
- A Supabase project.

### Local Development Setup

1.  **Clone the repository.**

2.  **Navigate to the web application directory:**
    ```bash
    cd dpm-web
    ```

3.  **Set up environment variables:**
    -   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    -   Open the new `.env` file and add your Supabase project URL and Anon Key. These can be found in your Supabase project's "API" settings.
        ```
        VITE_SUPABASE_URL=https://your-project-id.supabase.co
        VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
        ```

4.  **Install dependencies:**
    ```bash
    npm install
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Key Features & Code Structure

### Core User Flows & Pages

-   **Authentication (`/login`, `/register`):** Handled by `LoginPage.tsx` and `RegisterPage.tsx`, using Supabase Auth.
-   **Role Selection (`/`):** The `RoleSelectorPage.tsx` is the entry point for new users after login, directing them based on their chosen role ('admin' or 'sponsor').
-   **Admin Dashboard & Map Editor (`/event/:eventId`):** The `MapEditorPage.tsx` is the primary interface for admins. It allows for:
    -   Creating new events.
    -   Uploading a floorplan image via the `ImageUploader.tsx` component.
    -   Adding, moving, and resizing vendor booths on the canvas.
    -   Generating unique vendor signup links.
-   **Vendor Signup (`/vendor-signup`):** The `VendorSignupPage.tsx` allows a user with a valid token from a signup link to create their account.
-   **Sponsor Dashboard (`/sponsor-dashboard`):** The `SponsorDashboardPage.tsx` displays hard-coded ROI metrics for the MVP.

### Important Directories

-   `src/pages/`: Contains all the top-level page components.
-   `src/components/`: Contains reusable UI components.
-   `src/contexts/`: Contains React Context providers, notably `AuthContext.tsx` which manages user sessions and profiles.
-   `src/lib/`: Contains the Supabase client initialization.

### Supabase Backend

The backend is powered entirely by Supabase:

-   **Auth:** Manages user sign-up and login.
-   **Database:**
    -   `profiles`: Stores user data and their role (`admin`, `sponsor`).
    -   `events`: Stores event information.
    -   `vendors`: Stores vendor/sponsor data, linked to events.
-   **Storage:** The `floorplans` bucket stores map images uploaded by admins.
-   **RPCs (Remote Procedure Calls):** Custom SQL functions are used for security-sensitive operations like creating and verifying vendor signup tokens.

---
*Last updated: 2025-11-10*
