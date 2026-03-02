---
description: How to distribute NavEaze Magic Links via WhatsApp
---

# WhatsApp Distribution Workflow

This guide outlines two primary methods for distributing NavEaze Magic Links to attendees for the AFDA Orientation Week Pilot: **Manual Broadcast** (for smaller groups, < 250) and **WhatsApp Business API** (Twilio integration, for larger scale).

## Option 1: Manual Broadcast (Zero Cost, Immediate)
*Recommended for the AFDA Orientation Pilot.*

### 1. Preparation
1. Ensure your marketing or ops phone has all target attendees saved as contacts.
2. Create a **WhatsApp Broadcast List** containing the relevant attendees (Max 256 per list).

### 2. Message Template Formulation
Use the AFDA template format previously defined. The macro `?attendee_id=` will be the entry point.

**Template:**
```
Hey [Name]! 👋 Welcome to AFDA Orientation Week! 🎬✨
To help you find your way around campus easily, we're using NavEaze.

Hit this link to get your personal interactive map:
👉 https://[DPM_DOMAIN]/waitlist?attendee_id=[UNIQUE_ID]

No app download required. See you on campus! 📍
```

### 3. Execution
1. Send the base message to the broadcast list.
2. *Limitation:* Broadcasts do not support dynamic variables easily. To use magic links, you must either:
   - Send generic links: `.../waitlist` and have them enter their email.
   - Send individual messages per attendee using WhatsApp Web and a spreadsheet mail-merge script (e.g., WA Web Plus for WhatsApp extension).

---

## Option 2: WhatsApp Business API via Twilio (Automated, Scalable)
*Recommended for Post-Pilot larger deployments.*

### 1. Twilio Setup
1. Create a [Twilio Account](https://www.twilio.com/) and register a WhatsApp Sender Number.
2. Submit your message template to WhatsApp for approval (required for outbound promotional/utilitarian messaging).
   - Use `{{1}}` for the Name variable.
   - Use `{{2}}` for the Magic Link URL variable.

### 2. DPM Backend Integration
Use Supabase Edge Functions or a Node cron job to trigger the Twilio API.

**Example Endpoint Payload:**
```json
{
  "To": "whatsapp:+27821234567",
  "From": "whatsapp:+[YOUR_TWILIO_NUMBER]",
  "Template": "afda_orientation_welcome",
  "Parameters": {
    "1": "John",
    "2": "https://[DPM_DOMAIN]/waitlist?attendee_id=123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 3. Execution Flow
1. Admin uploads attendee CSV into DPM Admin panel.
2. DPM generates UUIDs and creates `attendees` records.
3. Admin clicks **"Send Invites"**.
4. Edge Function iterates through attendees, formatting the Magic Link and calling the Twilio API.

---

## Tracking & Analytics
Regardless of the method used, NavEaze tracks onboarding success via:
- **UTM Parameters**: Add `&utm_source=whatsapp` to the link.
- **Onboarding Telemetry**: When an attendee clicks the link and accepts POPIA consent, the `attendees` table is updated with `onboarded_at = NOW()`.
