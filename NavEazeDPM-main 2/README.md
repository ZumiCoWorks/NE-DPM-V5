NavEaze: The Complete Event Management & Navigation Platform
NavEaze is a comprehensive, dual-platform solution designed to streamline event management for organizers and enhance the on-site experience for attendees and vendors. The ecosystem consists of a feature-rich mobile application for end-users and a powerful web-based Digital Project Management (DPM) tool for event creators.

1. NavEaze Mobile App (for Attendees & Vendors)
The mobile application is the primary interface for event attendees and a utility for vendors to manage their location.

Attendee Features:
Event Discovery: Browse and search for active and upcoming events.

Interactive Maps: Navigate venues using detailed, interactive floor plans with pathfinding between points of interest (POIs).

Augmented Reality Navigation: Use your phone's camera to see AR overlays guiding you to your destination.

Buddy System: Connect with friends via email to see each other's locations on the map in real-time and manage buddy requests.

Flexible Access: Explore events as a guest or create an account to unlock social features like the buddy system.

Real-Time User Location: See your own pinpointed location on the map, updated in real-time via GPS.

Vendor Features:
Simple Location Pinging: Vendors can easily update their location on the event map by scanning a QR code at a designated POI, allowing attendees to find them effortlessly.

Dedicated Vendor Dashboard: A simple interface to manage their presence at an event.

2. NavEaze DPM (Web-Based Digital Project Management)
The DPM is a sophisticated web application for Venue Owners and Event Organizers to create, manage, and deploy event experiences.

Key DPM Features:
Role-Based Dashboards:

Venue Owner: Create and manage reusable venue templates, defining the basic layout and structure of a physical space.

Event Organizer: Use venue templates or upload custom floorplans to create specific events.

Interactive Floorplan Editor: A powerful canvas-based tool to bring floorplans to life:

Draw & Manage Layouts: Add, delete, and edit nodes, segments (walkable paths), POIs, and defined zones (e.g., "Food Court," "Restricted Area") directly on the floorplan image.

Scale Calibration: Calibrate the map's scale by defining a known real-world distance between two points.

Georeferencing: Anchor the map to real-world GPS coordinates for accurate user and AR positioning.

Pathfinding Tool: Test the generated navigation paths by finding the shortest route between any two points on the map.

Vendor & Dynamic Location Management:

Pre-register vendors for an event.

Generate secure, unique sign-up links for vendors to create their accounts.

Monitor the status of POIs, which can be activated in real-time by vendors scanning location-specific QR codes.

Data Export: Export all event data (floorplan, nodes, segments, POIs, etc.) as a single JSON file for use in the mobile application.

Technologies Used
The NavEaze platform is built on a modern, robust tech stack:

Frontend (Web DPM): React, Vite.js

Frontend (Mobile): React Native

Backend & Database: Supabase

Authentication: Manages user sign-up and sign-in for all roles (Venue Owner, Event Organizer, Attendee, Vendor).

PostgreSQL Database: Securely stores all data, including floorplans, nodes, segments, POIs, user profiles, and buddy relationships.

Storage: Hosts all floorplan images and other assets.

Edge Functions: Powers serverless logic, such as vendor sign-up and location pinging.

Mapping & Drawing (Web DPM): konva for the interactive canvas.

Mobile App Technologies:

Navigation: React Navigation

Hardware Integration: React Native Camera (for AR/QR), React Native Sensors, Geolocation Service, and React Native BLE PLX for beacon detection.

Styling: The project uses a modern, dark-themed CSS variable system for a consistent and professional look.

Project Structure
The project is split into two main parts: the React Native mobile application and the React-based web DPM.

src/ (mobile): Contains the React Native application screens, services, navigation, and types.

src/ (web): Contains the React components for the web-based DPM, including the main FloorplanEditor and VendorSignupPage.

src/components: Reusable React components for the web app.

src/supabaseClient.js: Configures the Supabase client for the web app.