// Uses global fetch (Node 18+)

const TOKEN = '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';
const REPO = 'ZumiCoWorks/NE-DPM-V5';
const BASE = 'https://api.github.com';

const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
};

async function api(path, method = 'GET', body = null) {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();
    return { status: res.status, data };
}

// --- LABELS ---
const LABELS = [
    { name: 'status: ✅ done', color: '0e8a16', description: 'Completed' },
    { name: 'status: 🔵 in progress', color: '0075ca', description: 'In progress' },
    { name: 'status: ⬜ todo', color: 'e4e669', description: 'Planned' },
    { name: 'area: navigation', color: 'e99695', description: 'Map & Pathfinding' },
    { name: 'area: safety', color: 'd93f0b', description: 'Safety & Alerts' },
    { name: 'area: analytics', color: '1d76db', description: 'Data & Charts' },
    { name: 'area: admin', color: 'bfd4f2', description: 'Admin Dashboard' },
    { name: 'area: pwa', color: '5319e7', description: 'Mobile PWA' },
    { name: 'simulation', color: 'f9d0c4', description: 'Mock/Demo data' },
];

// --- ISSUES ---
const ISSUES = [
    // DONE
    {
        title: '✅ Implement Pulsing Navigation Arrows (PWA)',
        body: 'Implemented animated SVG compass arrows in `AttendeePWANew.tsx` to give attendees real-time directional guidance. Includes CSS keyframe animations.',
        labels: ['status: ✅ done', 'area: navigation', 'area: pwa'],
    },
    {
        title: '✅ Activate SOS Distress Button (Backend)',
        body: 'Connected the distress button in the Attendee PWA to Supabase. Creates a row in `safety_alerts` table with GPS coordinates, user ID and timestamp.',
        labels: ['status: ✅ done', 'area: safety', 'area: pwa'],
    },
    {
        title: '✅ Create safety_alerts Database Table',
        body: 'Created `safety_alerts` table migration with columns: `id`, `type`, `status`, `gps_lat`, `gps_lng`, `user_id`, `created_at`, `resolved_at`, `resolved_by`.',
        labels: ['status: ✅ done', 'area: safety'],
    },
    {
        title: '✅ Build Security Command Center Dashboard (/security)',
        body: 'Full split-view security dashboard with:\n- Left panel: Live alert feed with Acknowledge/Resolve actions\n- Right panel: Leaflet map with real floorplan overlay\n- Real-time Supabase subscription',
        labels: ['status: ✅ done', 'area: safety', 'area: admin'],
    },
    {
        title: '✅ Staff PWA Safety Tab — Receive & Resolve Alerts',
        body: 'Added Safety tab to StaffPWA that subscribes to `safety_alerts` in real-time. Triggers vibration and sound on new alert. Supports Acknowledge and Resolve actions.',
        labels: ['status: ✅ done', 'area: safety', 'area: pwa'],
    },
    {
        title: '✅ Crowd Intelligence Heatmap (Security Dashboard)',
        body: 'Implemented `useCrowdSimulation` hook that generates 80 animated "attendee" dots moving within GPS bounds. Rendered as `CircleMarker` components on Leaflet map.\n\n> ⚠️ Simulation only — not real attendee data.',
        labels: ['status: ✅ done', 'area: analytics', 'area: safety', 'simulation'],
    },
    {
        title: '✅ Sponsor ROI Analytics Dashboard (/sponsors)',
        body: 'Built full Sponsor Analytics page with:\n- Hourly Traffic area chart (Recharts)\n- Engagement Depth pie chart\n- KPI cards (Visits, Dwell Time, Conversion Rate)\n- Sponsor selector toggle\n\n> ⚠️ All data is simulated mock values.',
        labels: ['status: ✅ done', 'area: analytics', 'simulation'],
    },
    {
        title: '✅ Fix navigation_points Schema (Add event_id)',
        body: 'Created SQL migration to add `event_id` column to `navigation_points` and `navigation_segments` tables so nodes are scoped per event.',
        labels: ['status: ✅ done', 'area: navigation'],
    },
    {
        title: '✅ QR Code Scanner — Snap Blue Dot to Known Position',
        body: 'Implemented QR scanning in Attendee PWA using `jsqr`. When a code is scanned, the blue dot teleports to the pre-defined GPS coordinates encoded in the QR code, fixing GPS drift.',
        labels: ['status: ✅ done', 'area: navigation', 'area: pwa'],
    },
    {
        title: '✅ Floorplan Upload & Map Editor Integration',
        body: 'Admin can upload a floorplan image which is stored in Supabase Storage. The Map Editor loads the floorplan as a Leaflet ImageOverlay. Supports GPS calibration via affine transformation.',
        labels: ['status: ✅ done', 'area: admin', 'area: navigation'],
    },
    {
        title: '✅ Event Setup Wizard (Onboarding Flow)',
        body: 'Built multi-step Event Setup page that guides admin through: Event details → Venue → Floorplan upload → Map calibration → Publish.',
        labels: ['status: ✅ done', 'area: admin'],
    },
    {
        title: '✅ AuthContext Error Handling (AbortError / Timeout)',
        body: 'Patched `AuthContext.tsx` to handle `AbortError` and profile fetch timeouts gracefully, preventing console spam and app instability on slow connections.',
        labels: ['status: ✅ done', 'area: admin'],
    },
    // IN PROGRESS
    {
        title: '🔵 Debug Navigation Graph — Fix Orphan Nodes',
        body: `POI nodes (red pins in Map Editor) are not connected to the main navigation path (blue lines), causing A* pathfinding to fail and fall back to Compass mode.\n\n**Steps:**\n- [x] Identify root cause (nodes not connected via segments)\n- [x] Create diagnostic script \`scripts/find_orphan_nodes.ts\`\n- [ ] Manually connect nodes via Map Editor\n- [ ] Validate graph with "Test Connectivity" button`,
        labels: ['status: 🔵 in progress', 'area: navigation'],
    },
    {
        title: '🔵 Fix Real-Time Alerts Not Showing on Security Dashboard',
        body: `SOS alerts sent from PWA are not appearing on the Security Dashboard in real-time.\n\n**Root cause suspect:** Missing Supabase RLS policy or Realtime not enabled on \`safety_alerts\`.\n\n**Fix SQL (needs to be run in Supabase):**\n\`\`\`sql\nalter publication supabase_realtime add table safety_alerts;\ncreate policy "Allow All Access" on "public"."safety_alerts" for ALL to public using (true) with check (true);\n\`\`\``,
        labels: ['status: 🔵 in progress', 'area: safety'],
    },
    // TODO
    {
        title: '⬜ End-to-End Navigation Flow Test',
        body: 'Test the complete navigation flow:\n1. Admin creates event and uploads floorplan\n2. Admin places nodes and draws paths in Map Editor\n3. Attendee opens PWA, selects destination\n4. A* finds path and shows turn-by-turn arrows\n5. QR scan snaps position',
        labels: ['status: ⬜ todo', 'area: navigation'],
    },
    {
        title: '⬜ Connect Real Crowd Data to Security Dashboard',
        body: 'Replace the `useCrowdSimulation` mock with real attendee GPS positions from Supabase. Requires attendees to opt-in and periodically send their location.',
        labels: ['status: ⬜ todo', 'area: analytics', 'area: safety'],
    },
    {
        title: '⬜ Implement RBAC (Role-Based Access Control)',
        body: 'Enforce role separation:\n- Organizer: Full admin access\n- Staff: Alert response only\n- Sponsor: ROI dashboard only\n- Attendee: Navigation PWA only',
        labels: ['status: ⬜ todo', 'area: admin'],
    },
    {
        title: '⬜ Add project scope to GitHub token for Project Board automation',
        body: 'The current token lacks `project` scope. Regenerate with `project` scope to allow automated GitHub Project v2 board creation and card management.',
        labels: ['status: ⬜ todo', 'area: admin'],
    },
];

async function main() {
    console.log('🏷️  Creating labels...');
    for (const label of LABELS) {
        const { status, data } = await api(`/repos/${REPO}/labels`, 'POST', label);
        if (status === 201) console.log(`  ✅ Created label: ${label.name}`);
        else if (status === 422) console.log(`  ⚠️  Label exists: ${label.name}`);
        else console.log(`  ❌ Label error [${status}]: ${data.message}`);
    }

    console.log('\n📋 Creating issues...');
    for (const issue of ISSUES) {
        const { status, data } = await api(`/repos/${REPO}/issues`, 'POST', issue);
        if (status === 201) console.log(`  ✅ #${data.number}: ${issue.title}`);
        else console.log(`  ❌ Issue error [${status}]: ${data.message}`);
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n🎉 Done! View at: https://github.com/ZumiCoWorks/NE-DPM-V5/issues');
}

main().catch(console.error);
