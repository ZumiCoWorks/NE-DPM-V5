These rules are non-negotiable and prioritize the fastest path to a working DPM portal and the ready Mobile APIs defined in the PRD.

Rule Set 1: Scope Lock & Deferral

ID	Rule	Constraint & Enforcement
P-1	Strict Scope Lock	We only build the features listed in the Organizer DPM PRD (Section 2). Any request for features outside of Authentication, Event/Map Setup, or AR Management will be vetoed until the MVP is functional.
P-2	No Real-Time/Analytics	Do not implement any code related to real-time connections (WebSockets, Supabase Realtime), notifications, or analytics tracking. All these services are deferred.
P-3	Safety First	The logic and API for configuring Emergency Paths must be robust and simple. Prioritize storing this critical data correctly in NAVIGATION_PATHS and exposing it clearly via the mobile API.


Rule Set 2: Technical Simplicity & Execution

ID	Rule	Constraint & Enforcement
P-4	Focus on Data Contracts	Prioritize stable backend API routes and PostgreSQL schemas (Supabase) first. The frontend's development must wait until the API contracts are confirmed to prevent rework.
P-5	Reuse Only Necessary Code	When integrating your previous codebase, only lift code for direct functionality (e.g., a login handler, a simple CRUD function). Do not port any large, complex, or unused modules (e.g., old payment processing, complex logging middleware).
P-6	Functional UI Over Polish	The Organizer DPM portal must be highly functional and intuitive (easy to place nodes and zones), but we will accept a clean, simple Tailwind UI over time-consuming visual polish. Aesthetics are secondary to function.
P-7	Single App, No Microservices	All backend logic (Auth, Event, Floorplan, AR) will reside in a single Node/Express application. Do not introduce microservices—this adds complexity we cannot afford in the MVP.

Help me build this in managable bits (but keep in context that i really need this functional ASAP)