# Role Management - Quick Setup Guide

## 🎯 Goal
Fix your current account and set up automatic admin assignment for future users.

---

## 📋 Prerequisites
- ✅ Supabase Dashboard access
- ✅ Your account email address
- ⏱️ Time needed: 5 minutes

---

## 🚀 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New query**

### Step 2: Install Auto-Admin Trigger
1. Open the file: `database/01_auto_admin_trigger.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. ✅ You should see: "Auto-admin trigger installed successfully!"

### Step 3: Fix Your Current Account
1. Open the file: `database/02_fix_current_user.sql`
2. **IMPORTANT:** Find this line:
   ```sql
   WHERE email = 'admin@navease.com';  -- ← CHANGE THIS
   ```
3. Replace `'admin@navease.com'` with your actual email
4. Copy the entire script
5. Paste into Supabase SQL Editor (new query)
6. Click **Run**
7. ✅ You should see: "User role updated to admin!"

### Step 4: Log Out and Back In
1. Go back to your app: `http://localhost:5173`
2. Click **Sign out** in the sidebar
3. Log back in with your credentials
4. ✅ You should now see the **full admin sidebar** with all menu items:
   - Dashboard
   - Events
   - Venues
   - Map Editor
   - ROI Reports
   - AR Campaigns

---

## ✅ Verification Checklist

After completing the steps above, verify:

- [ ] Sidebar shows all 6+ menu items (not just 2)
- [ ] Dashboard shows "Admin Dashboard" (not "Staff Dashboard")
- [ ] You can click "Events" and see the events page
- [ ] You can create/edit events without being redirected
- [ ] You can access Map Editor
- [ ] Demo Mode toggle works in sidebar

---

## 🔍 Troubleshooting

### Issue: Still seeing "Staff Dashboard"
**Solution:**
1. Make sure you updated the email in the SQL script
2. Verify the SQL ran successfully (check for success message)
3. Clear browser cache and cookies
4. Log out completely and log back in

### Issue: Trigger not working for new users
**Solution:**
1. Run this in SQL Editor to check if trigger exists:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname = 'assign_first_admin';
   ```
2. If no results, re-run the trigger installation script

### Issue: Can't access Supabase Dashboard
**Solution:**
- Check your Supabase credentials
- Ensure you're logged into the correct project
- Contact Supabase support if needed

---

## 🎉 What Happens Next?

### For You (Current User)
- ✅ Full admin access
- ✅ Can create/edit events, venues, maps
- ✅ Can manage all aspects of the system

### For Future Users
- 🔐 Automatically assigned 'staff' role
- 👤 Limited access (can only see their own data)
- 👑 You can promote them to admin later (via SQL or future admin panel)

---

## 📝 Notes

- The trigger only affects **new** user registrations
- Existing users need manual role updates (like we just did)
- First user in a fresh database will automatically be admin
- All subsequent users will be staff by default

---

## 🚀 Next Steps (Optional)

After your showcase, consider building:
1. **Admin Panel** (`/admin/users`) - Manage user roles via UI
2. **Audit Logging** - Track who changed what roles
3. **Email Notifications** - Notify users when their role changes

---

**Ready?** Open Supabase and let's get started! 🎯
