// update_kanban.mjs — adds new issues + resolves old ones
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
    return { status: res.status, data: await res.json() };
}

// New issues to create
const NEW_ISSUES = [
    {
        title: '✅ Fix Multiple GoTrueClient Instances (PWA Supabase Singleton)',
        body: `## Problem\n\`AttendeePWANew.tsx\` called \`createClient()\` directly inside \`fetchEvents()\` and \`fetchNavigationData()\` instead of using the global singleton from \`lib/supabase.ts\`.\n\nThis caused: *Multiple GoTrueClient instances detected in the same browser context*\n\n## Fix Applied ✅\nRemoved two inline \`createClient()\` calls and replaced with the already-imported \`supabase\` singleton.\n\n## Files Changed\n- \`src/pages/mobile/AttendeePWANew.tsx\``,
        labels: ['status: ✅ done', 'area: pwa'],
    },
    {
        title: '🚀 Staff Dispatch Button — Assign Alert to Staff Member',
        body: `## Feature\nWhen a DISTRESS alert appears on the Security Dashboard, the security operator should be able to assign it to a nearby staff member.\n\n## Proposed Flow\n1. Security operator sees alert in Active panel\n2. Taps "Dispatch Staff" button\n3. Selects available staff member\n4. Staff PWA receives push notification with alert location\n5. Alert status changes to "dispatched" → "resolved"\n\n## Scope\n- Add \`dispatched_to\` column to \`safety_alerts\` table\n- Add Dispatch UI to Security Dashboard\n- Add notification listener to Staff PWA`,
        labels: ['status: ⬜ todo', 'area: safety', 'area: pwa'],
    },
    {
        title: '📍 Real Attendee Position Tracking (Opt-In Foreground GPS)',
        body: `## Feature\nReplace the simulated crowd heatmap on the Security Dashboard with real attendee GPS positions.\n\n## How It Works (PWA-Compatible)\n1. Attendee opens PWA and grants location permission\n2. "Share my location during this event" opt-in toggle appears\n3. When enabled, PWA sends GPS every 30s to \`attendee_positions\` table\n4. Security Dashboard subscribes via Supabase Realtime\n5. Real blue dots appear on the map\n\n> Note: Only works while the attendee has the PWA open (foreground only). Background tracking requires a native app.\n\n## Scope\n- Create \`attendee_positions\` table (user_id, event_id, lat, lng, created_at)\n- Add opt-in toggle to Attendee PWA Safety tab\n- Update Security Dashboard to show real positions\n- RLS: only security roles can read all positions`,
        labels: ['status: ⬜ todo', 'area: analytics', 'area: safety'],
    },
];

// Issues to close by title keyword (now resolved)
const TO_CLOSE_KEYWORDS = ['Fix Real-Time Alerts'];

async function main() {
    // 1. Create new issues
    console.log('📋 Creating new issues...');
    for (const issue of NEW_ISSUES) {
        const { status, data } = await api(`/repos/${REPO}/issues`, 'POST', issue);
        if (status === 201) console.log(`  ✅ Created #${data.number}: ${issue.title}`);
        else console.log(`  ❌ Error [${status}]: ${data.message}`);
        await new Promise(r => setTimeout(r, 400));
    }

    // 2. Find and close resolved issues
    console.log('\n🔍 Finding issues to close...');
    const { data: openIssues } = await api(`/repos/${REPO}/issues?state=open&per_page=50`);

    for (const kw of TO_CLOSE_KEYWORDS) {
        const match = openIssues.find(i => i.title.includes(kw));
        if (match) {
            // Update title to mark done and close
            await api(`/repos/${REPO}/issues/${match.number}`, 'PATCH', {
                title: match.title.replace('🔵', '✅').replace('⬜', '✅'),
                state: 'closed',
                labels: [...(match.labels?.map(l => l.name).filter(n => !n.includes('in progress')) || []), 'status: ✅ done'],
            });
            console.log(`  ✅ Closed #${match.number}: ${match.title}`);
        } else {
            console.log(`  ⚠️  Not found: "${kw}"`);
        }
    }

    console.log('\n🎉 Done! https://github.com/ZumiCoWorks/NE-DPM-V5/issues');
}

main().catch(console.error);
