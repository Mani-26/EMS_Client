/**
 * Test script for custom fields storage and retrieval
 * 
 * This script can be run in the browser console to test if custom fields
 * are being properly stored and retrieved from sessionStorage.
 */

// Test data
const testCustomFields = {
  'Full Name': 'Test User',
  'Company': 'Test Company',
  'Designation': 'Test Designation',
  'Age': 30,
  'Is Student': true
};

// Function to store custom field values
function storeCustomFields() {
  console.log('Storing custom field values in sessionStorage:', testCustomFields);
  sessionStorage.setItem('customFieldValues', JSON.stringify(testCustomFields));
  
  // Verify the data was stored correctly
  const storedData = sessionStorage.getItem('customFieldValues');
  console.log('Raw stored custom fields:', storedData);
  
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      console.log('Parsed stored custom fields:', parsedData);
      return true;
    } catch (e) {
      console.error('Error parsing stored custom fields:', e);
      return false;
    }
  } else {
    console.warn('WARNING: Failed to store custom field values in sessionStorage!');
    return false;
  }
}

// Function to retrieve custom field values
function retrieveCustomFields() {
  console.log('Retrieving custom field values from sessionStorage');
  const storedData = sessionStorage.getItem('customFieldValues');
  console.log('Raw stored custom fields:', storedData);
  
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      console.log('Parsed stored custom fields:', parsedData);
      return parsedData;
    } catch (e) {
      console.error('Error parsing stored custom fields:', e);
      return null;
    }
  } else {
    console.warn('WARNING: No custom field values found in sessionStorage!');
    return null;
  }
}

// Function to simulate the payment verification process
function simulatePaymentVerification() {
  console.log('Simulating payment verification process');
  
  // Get custom field values from session storage
  const customFieldValues = retrieveCustomFields();
  
  if (!customFieldValues) {
    console.error('No custom field values found - verification would fail!');
    return;
  }
  
  // Create plain object for custom fields
  const plainCustomFields = {};
  if (typeof customFieldValues === 'object' && !Array.isArray(customFieldValues)) {
    Object.entries(customFieldValues).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        plainCustomFields[key] = value;
      }
    });
  }
  
  console.log('Custom field values for verification:', plainCustomFields);
  
  // Create mock registration data
  const mockRegistrationData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    eventId: 'test-event-id',
    customFieldValues: plainCustomFields
  };
  
  console.log('Registration data for verification:', mockRegistrationData);
  
  // In a real scenario, this would be sent to the server
  console.log('This data would be sent to the server for verification');
}

// Run the tests
console.log('=== CUSTOM FIELDS STORAGE TEST ===');
const stored = storeCustomFields();
console.log('Storage successful:', stored);

console.log('\n=== CUSTOM FIELDS RETRIEVAL TEST ===');
const retrieved = retrieveCustomFields();
console.log('Retrieval successful:', !!retrieved);

console.log('\n=== PAYMENT VERIFICATION SIMULATION ===');
simulatePaymentVerification();

// Instructions for manual testing
console.log('\n=== MANUAL TESTING INSTRUCTIONS ===');
console.log('1. Run this script in the browser console');
console.log('2. Navigate to another page and back');
console.log('3. Run retrieveCustomFields() to check if data is still there');
console.log('4. Run simulatePaymentVerification() to simulate the payment verification process');