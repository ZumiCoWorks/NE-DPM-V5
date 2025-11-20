# 🗺️ Complete Map Editor Guide for Indoor/Outdoor Navigation

## Your Use Case: Main Entrance (Outdoor) → Presentation Room (Indoor)

---

## ⚙️ **Step 0: Apply Database Migration (One-time)**

Run this SQL in **Supabase Dashboard > SQL Editor**:

```sql
-- Link POIs to Navigation Nodes
ALTER TABLE public.navigation_points 
ADD COLUMN IF NOT EXISTS linked_node_id UUID REFERENCES navigation_points(id) ON DELETE SET NULL;

ALTER TABLE public.navigation_points 
ADD COLUMN IF NOT EXISTS is_destination BOOLEAN DEFAULT false;

ALTER TABLE public.navigation_points 
ADD COLUMN IF NOT EXISTS instructions TEXT;
```

Click **Run** → Done! ✅

---

## 📍 **Step-by-Step: Create Your Navigation System**

### **Phase 1: Set Up Event & Map (5 min)**

1. **Create Event**:
   - Go to: `http://localhost:5173/events/create`
   - Name: "My Presentation Event"
   - Navigation Mode: **Hybrid**
   - GPS Center: Your building's GPS coordinates
   - Click "Create Event"

2. **Upload Floorplan**:
   - Open Map Editor for your event
   - Upload your venue map/floorplan image
   - Click "⚠️ Calibrate GPS" → Auto method → 0° North → Complete

---

### **Phase 2: Add Destination POIs (2 min)**

These are the places people want to go:

1. Click **"poi"** mode button (top of editor)

2. **Main Entrance POI** (outdoor):
   - Click on map where entrance is
   - Name: "Main Entrance"
   - Type: entrance
   - Zone: **Outdoor**
   - GPS: Click "📍 Use My Current Location" (if there) or enter coordinates
   - Save

3. **Presentation Room POI** (indoor):
   - Click on map where presentation room is
   - Name: "Presentation Room"
   - Type: conference_room
   - Zone: **Indoor**
   - GPS: Enter approx. coordinates
   - Save

4. **Other POIs** (restrooms, reception, etc.):
   - Repeat for each destination
   - Mark indoor locations as "Indoor" zone

---

### **Phase 3: Add Navigation Nodes (5 min)**

These are waypoints along the path (NOT destinations):

1. Click **"node"** mode button

2. **Add nodes at each decision point**:
   
   Example nodes for entrance → presentation room:
   - **Node 1**: At main entrance (same spot as POI) - outdoor
   - **Node 2**: Path turn/corner outside building - outdoor
   - **Node 3**: Building entrance door - **TRANSITION**
   - **Node 4**: Inside lobby - indoor
   - **Node 5**: Hallway intersection - indoor
   - **Node 6**: Presentation room door (same spot as POI) - indoor

3. **Click to place each node** on the map
   - They appear as small circles
   - Name them (optional): "Entrance", "Turn 1", "Building Door", etc.

---

### **Phase 4: Draw Path Segments (3 min)**

Connect nodes to create walkable paths:

1. Click **"draw-path"** mode button

2. **Draw the main route**:
   - Click **Node 1** (entrance) → Click **Node 2** (corner) → Segment created ✅
   - Click **Node 2** → Click **Node 3** (building door) → Segment created ✅
   - Click **Node 3** → Click **Node 4** (lobby) → Segment created ✅
   - Click **Node 4** → Click **Node 5** (hallway) → Segment created ✅
   - Click **Node 5** → Click **Node 6** (presentation room) → Segment created ✅

3. **Draw alternative paths** (if any):
   - From Node 4 to restroom node
   - From Node 5 to reception node
   - etc.

4. **Result**: You now have a connected graph!
   ```
   Entrance → Corner → Door → Lobby → Hallway → Presentation Room
                                 ↓
                              Restroom
   ```

---

### **Phase 5: Link POIs to Nodes (IMPORTANT!)**

This connects destinations to the navigation graph:

**Manual Method** (for now):
1. Remember which node is near each POI
2. In Supabase Dashboard → `navigation_points` table:
   - Find the POI row (has `poi_name`)
   - Set `linked_node_id` to the nearby node's ID
   - Set `is_destination` to `true`

**Example**:
- "Main Entrance" POI → Link to Node 1
- "Presentation Room" POI → Link to Node 6

**(I can add a UI button for this if you need it!)**

---

### **Phase 6: Save & Test (2 min)**

1. Click **"Save (server)"** button in Map Editor

2. **Test Pathfinding**:
   - Open attendee PWA on phone: `http://localhost:5173/attendee?event_id=YOUR_EVENT_ID`
   - Go to **Directory** tab
   - Click "Presentation Room"
   - Click **"Get Directions"**
   - Should show:
     ```
     📍 Start at Main Entrance
     ➡️ Continue straight (50m)
     ↱ Turn right at Corner
     🚪 Enter building at Building Door
     ➡️ Continue straight in Lobby
     ↱ Turn right at Hallway
     🎯 Arrive at Presentation Room
     ```

---

## 🎨 **Visual Guide**

```
YOUR MAP SHOULD LOOK LIKE THIS:

🟢 Main Entrance POI (destination)
 ↓
●  Node 1 (waypoint)
 ↓
●  Node 2 (corner)
 ↓
●  Node 3 (building entrance - TRANSITION)
 ↓
●  Node 4 (lobby)
 ↓
●  Node 5 (hallway intersection)
 ↓
🔴 Presentation Room POI (destination)

Lines connecting nodes = segments (paths)
```

---

## 💡 **Pro Tips**

### **Zone Types Matter!**
- **Outdoor**: Use GPS for positioning (5-20m accuracy)
- **Indoor**: Use QR codes for precise positioning (1-2m accuracy)
- **Transition**: Special points where navigation mode switches

### **Node Placement Tips**:
- Place nodes at every turn/corner
- Place nodes at doorways
- Place nodes at hallway intersections
- DON'T place too many nodes (only where direction changes)

### **QR Codes for Indoor Nodes**:
- Each indoor node should have a QR code
- When attendee scans QR → precise positioning
- Without QR scan → relies on last known GPS (less accurate indoors)

---

## ⚡ **Quick Checklist**

Before your pilot event:

- [ ] Event created with Hybrid navigation mode
- [ ] Floorplan uploaded and GPS calibrated
- [ ] Main Entrance POI added (outdoor)
- [ ] Presentation Room POI added (indoor)
- [ ] Navigation nodes placed at all decision points
- [ ] Segments drawn connecting all nodes
- [ ] POIs linked to nearest nodes (via database)
- [ ] Tested pathfinding on phone
- [ ] QR codes generated for indoor nodes (if using)
- [ ] QR codes printed and placed at nodes (if using)

---

## 🐛 **Troubleshooting**

**"No path found" error**:
→ Check all nodes are connected by segments
→ Make sure there's a continuous path from entrance to destination

**Directions say "Turn around" everywhere**:
→ Recalibrate floorplan with correct North bearing

**Indoor positioning not working**:
→ Place QR codes at nodes
→ Attendee must scan QR to calibrate indoor position

**POI doesn't appear in navigation**:
→ Make sure POI is linked to a node (linked_node_id field)
→ Make sure is_destination = true

---

## 🚀 **What Happens During the Event**

### Attendee Experience:

1. **Opens PWA** on phone
2. **Outdoor (at entrance)**:
   - GPS shows their blue dot at entrance
   - Clicks "Presentation Room" in Directory
   - Clicks "Get Directions"
   - Sees turn-by-turn instructions
   - Walks following arrows

3. **Transition (at building door)**:
   - Optional: Scan QR code at door
   - App switches from GPS to indoor mode

4. **Indoor (in building)**:
   - Scans QR code at lobby to calibrate position
   - Continues following directions
   - Scans QR at hallway intersection (if needed)
   - Arrives at presentation room!

---

## 🛠️ **Next Steps for You**

1. Run the SQL migration in Supabase Dashboard
2. Create your event with Hybrid mode
3. Follow Phase 1-6 above
4. Test at your venue
5. Let me know if you need:
   - POI-to-node linking UI button
   - QR code generator
   - Better turn-by-turn UI
   - Anything else!

**Time to complete**: ~20 minutes for full setup

Ready to start? 🎯
