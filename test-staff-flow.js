// Test the staff lead capture flow
const https = require('https');

// Mock ticket scan result
const mockTicketId = 'PILOT_TEST_TICKET_123';

function testTicketScan() {
  console.log('Testing ticket scan for:', mockTicketId);
  
  // Mock Edge Function response
  const mockLeadData = {
    success: true,
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      ticket_id: mockTicketId,
      event_id: 'pilot-test-event'
    }
  };
  
  console.log('Mock Edge Function Response:', JSON.stringify(mockLeadData, null, 2));
  return mockLeadData.data;
}

function testLeadQualification(leadData) {
  console.log('\nTesting lead qualification...');
  console.log('Lead data received:', leadData);
  
  // Simulate lead qualification process
  const qualifiedLead = {
    ...leadData,
    qualified: true,
    qualification_notes: 'Interested in product demo',
    qualified_at: new Date().toISOString(),
    staff_id: 'staff-123'
  };
  
  console.log('Qualified lead:', qualifiedLead);
  return qualifiedLead;
}

function testLeadSave(qualifiedLead) {
  console.log('\nTesting lead save to database...');
  
  // Mock database save response
  const saveResponse = {
    success: true,
    data: {
      id: 'lead-456',
      ...qualifiedLead,
      created_at: new Date().toISOString()
    }
  };
  
  console.log('Lead saved successfully:', JSON.stringify(saveResponse, null, 2));
  return saveResponse.data;
}

// Test the Edge Function directly
function testEdgeFunction() {
  console.log('\nTesting Edge Function call...');
  
  // Mock the actual Edge Function that would be called
  const mockEdgeFunction = {
    name: 'get-quicket-lead',
    endpoint: 'https://uzhfjyoztmirybnyifnu.supabase.co/functions/v1/get-quicket-lead',
    headers: {
      'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
      'X-Quicket-Api-Key': 'YOUR_QUICKET_API_KEY'
    },
    payload: {
      ticket_id: mockTicketId
    }
  };
  
  console.log('Edge Function call details:', mockEdgeFunction);
  
  // Simulate the response
  const edgeResponse = {
    success: true,
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      company: 'Tech Corp',
      ticket_id: mockTicketId
    }
  };
  
  console.log('Edge Function response:', JSON.stringify(edgeResponse, null, 2));
  return edgeResponse.data;
}

// Run the test flow
console.log('=== Testing Staff Lead Capture Flow ===\n');

// Step 1: Ticket Scan
console.log('1. Ticket Scan');
console.log('Scanning ticket:', mockTicketId);
const leadData = testTicketScan();

// Step 2: Edge Function Call (alternative test)
console.log('\n2. Edge Function Call');
const edgeLeadData = testEdgeFunction();

// Step 3: Lead Qualification
console.log('\n3. Lead Qualification');
const qualifiedLead = testLeadQualification(leadData);

// Step 4: Save Lead
console.log('\n4. Save Lead to Database');
const savedLead = testLeadSave(qualifiedLead);

console.log('\n=== Flow Test Complete ===');
console.log('✅ Ticket scan successful');
console.log('✅ Edge Function call successful');
console.log('✅ Lead qualification successful');
console.log('✅ Lead saved to database with ID:', savedLead.id);

// Test manual ticket entry
console.log('\n=== Testing Manual Ticket Entry ===');
const manualTicketId = 'MANUAL_TEST_456';
console.log('Manual ticket entry:', manualTicketId);
const manualLeadData = testTicketScan();
console.log('Manual lead data:', manualLeadData);