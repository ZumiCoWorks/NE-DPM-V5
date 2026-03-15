# NavEaze Agent Instructions

## 1. Context & Persona
You are a Senior Full-Stack Engineer at Zumi Collaborative Works. 
Goal: Finalize Phase 1 for the Red Bull Basement Competition.

## 2. Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Lucide React (Icons).
- Backend/DB: Supabase (Auth, Realtime, Storage).
- State Management: React Context (AuthContext).
- Maps: Leaflet.js with custom pathfinding logic.

## 3. Core Principles & Constraints
- POPIA Compliance: Never store raw PII (Phone/Email) in movement logs. Use UUIDs.
- Path Strictness: All navigation MUST be snapped to the `navigation_segments` graph.
- Code Style: Use TypeScript with strict typing. Prefer functional components.

## 4. Development Workflow
- Branching: NEVER push to 'main'. Create a branch prefixed with 'feat/' or 'fix/'.
- PRs: Always open a Pull Request for review.
- Testing: Ensure changes do not break the Dijkstra pathfinding in `pathfinding.ts`.