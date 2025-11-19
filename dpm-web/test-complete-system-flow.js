#!/usr/bin/env node

/**
 * Complete System Flow Test Script
 * Tests the entire flow: DPM → Attendee → Staff
 * Creates real data and verifies functionality
 */

import axios from 'axios';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5173';

// Test data
const testEvent = {
  name: 'Tech Summit 2024',
  description: 'Annual technology summit with AR navigation',
  start_date: '2024-12-15T09:00:00Z',
  end_date: '2024-12-15T18:00:00Z',
  venue_id: 'demo-venue-001'
};

const testVenue = {
  name: 'Cape Town Convention Center',
  address: '1 Lower Long Street, Cape Town',
  description: 'Main convention center for tech events'
};

const testQRNode = {
  qr_code_id: 'QR_TEST_001',
  x: 150,
  y: 200,
  event_id: 'test-event-001'
};

const testAttendee = {
  name: 'John Smith',
  email: 'john.smith@techcorp.com',
  company: 'TechCorp Solutions',
  ticket_id: 'TICKET_001'
};

const testLead = {
  full_name: 'Sarah Johnson',
  email: 'sarah.j@innovatetech.co.za',
  company: 'InnovateTech',
  job_title: 'Marketing Director',
  notes: 'Very interested in AR navigation solutions for events'
};

// Test results
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  passed: 0,
  failed: 0
};

function logTest(testName, status, details = '') {
  const result = { test: testName, status, details, timestamp: new Date().toISOString() };
  testResults.tests.push(result);
  if (status === 'PASS') testResults.passed++;
  else testResults.failed++;
  
  const statusColor = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  console.log(`${statusColor}[${status}] ${testName}\x1b[0m ${details}`);
}

async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.data.status === 'healthy') {
      logTest('Health Check', 'PASS', 'Server is running');
      return true;
    }
  } catch (error) {
    logTest('Health Check', 'FAIL', error.message);
    return false;
  }
}

async function testCreateVenue() {
  try {
    // First create a venue
    const venueData = {
      name: testVenue.name,
      address: testVenue.address,
      description: testVenue.description,
      status: 'active'
    };

    // Use service role to bypass auth for testing
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://uzhfjyoztmirybnyifnu.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
    );

    const { data, error } = await supabase
      .from('venues')
      .insert(venueData)
      .select()
      .single();

    if (error) throw error;
    
    logTest('Create Venue', 'PASS', `Created venue: ${data.name} (ID: ${data.id})`);
    return data.id;
  } catch (error) {
    logTest('Create Venue', 'FAIL', error.message);
    return null;
  }
}

async function testCreateEvent(venueId) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://uzhfjyoztmirybnyifnu.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
    );

    const eventData = {
      name: testEvent.name,
      description: testEvent.description,
      start_date: testEvent.start_date,
      end_date: testEvent.end_date,
      venue_id: venueId,
      status: 'active'
    };

    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    
    logTest('Create Event', 'PASS', `Created event: ${data.name} (ID: ${data.id})`);
    return data.id;
  } catch (error) {
    logTest('Create Event', 'FAIL', error.message);
    return null;
  }
}

async function testCreateQRNode(eventId) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://uzhfjyoztmirybnyifnu.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
    );

    const qrNodeData = {
      event_id: eventId,
      qr_code_id: testQRNode.qr_code_id,
      x: testQRNode.x,
      y: testQRNode.y,
      floorplan_id: 'main-floor'
    };

    const { data, error } = await supabase
      .from('map_qr_nodes')
      .insert(qrNodeData)
      .select()
      .single();

    if (error) throw error;
    
    logTest('Create QR Node', 'PASS', `Created QR node: ${data.qr_code_id} at (${data.x}, ${data.y})`);
    return data.id;
  } catch (error) {
    logTest('Create QR Node', 'FAIL', error.message);
    return null;
  }
}

async function testQRNodeAPI(eventId, qrCodeId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/editor/qr-nodes?event_id=${eventId}&qr_code_id=${qrCodeId}`);
    
    if (response.data && response.data.length > 0) {
      logTest('QR Node API', 'PASS', `Found QR node: ${response.data[0].qr_code_id}`);
      return true;
    } else {
      logTest('QR Node API', 'FAIL', 'QR node not found');
      return false;
    }
  } catch (error) {
    logTest('QR Node API', 'FAIL', error.message);
    return false;
  }
}

async function testCreateLead() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://uzhfjyoztmirybnyifnu.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
    );

    const leadData = {
      full_name: testLead.full_name,
      email: testLead.email,
      company: testLead.company,
      phone: testLead.phone,
      rating: testLead.rating,
      notes: testLead.notes,
      event_id: 'test-event-001',
      sponsor_id: 'test-sponsor-001',
      staff_id: 'test-staff-001'
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;
    
    logTest('Create Lead', 'PASS', `Created lead: ${data.full_name} (ID: ${data.id})`);
    return data.id;
  } catch (error) {
    logTest('Create Lead', 'FAIL', error.message);
    return null;
  }
}

async function testLeadsAPI() {
  try {
    const response = await axios.get(`${API_BASE_URL}/leads`);
    
    if (response.data && Array.isArray(response.data)) {
      logTest('Leads API', 'PASS', `Retrieved ${response.data.length} leads`);
      return true;
    } else {
      logTest('Leads API', 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Leads API', 'FAIL', error.message);
    return false;
  }
}

async function testPWAEndpoints() {
  try {
    // Test attendee PWA
    const attendeeResponse = await axios.get(`${FRONTEND_URL}/mobile/attendee`, { maxRedirects: 0, validateStatus: null });
    if (attendeeResponse.status === 200) {
      logTest('Attendee PWA', 'PASS', 'Endpoint accessible');
    } else {
      logTest('Attendee PWA', 'FAIL', `Status: ${attendeeResponse.status}`);
    }

    // Test staff PWA
    const staffResponse = await axios.get(`${FRONTEND_URL}/mobile/staff`, { maxRedirects: 0, validateStatus: null });
    if (staffResponse.status === 200) {
      logTest('Staff PWA', 'PASS', 'Endpoint accessible');
    } else {
      logTest('Staff PWA', 'FAIL', `Status: ${staffResponse.status}`);
    }

    return true;
  } catch (error) {
    logTest('PWA Endpoints', 'FAIL', error.message);
    return false;
  }
}

async function testDataFlow() {
  console.log('\n🚀 Starting Complete System Flow Test...\n');
  
  // Test 1: Health Check
  await testHealthCheck();
  
  // Test 2: Create test data
  console.log('\n📊 Creating Test Data...\n');
  const venueId = await testCreateVenue();
  const eventId = venueId ? await testCreateEvent(venueId) : null;
  const qrNodeId = eventId ? await testCreateQRNode(eventId) : null;
  const leadId = await testCreateLead();
  
  // Test 3: API Endpoints
  console.log('\n🔌 Testing API Endpoints...\n');
  if (eventId && qrNodeId) await testQRNodeAPI(eventId, testQRNode.qr_code_id);
  await testLeadsAPI();
  
  // Test 4: PWA Endpoints
  console.log('\n📱 Testing PWA Endpoints...\n');
  await testPWAEndpoints();
  
  // Summary
  console.log('\n📋 Test Summary:\n');
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: \x1b[32m${testResults.passed}\x1b[0m`);
  console.log(`Failed: \x1b[31m${testResults.failed}\x1b[0m`);
  console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  // Save results to file
  fs.writeFileSync('test-results-complete.json', JSON.stringify(testResults, null, 2));
  console.log('\n📄 Results saved to test-results-complete.json');
  
  return testResults.failed === 0;
}

// Run the test
testDataFlow().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});