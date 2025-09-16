import { getMCPClient } from './src/lib/mcp-client.js';

async function testCustomerSearch() {
  console.log('Testing customer search functionality...');

  const mcpClient = getMCPClient();

  try {
    // Test 1: Search for "Test User"
    console.log('\n=== Test 1: Search for "Test User" ===');
    const result1 = await mcpClient.findCustomerByName('Test User');
    console.log('Result:', JSON.stringify(result1, null, 2));

    // Test 2: Search for partial name "Test"
    console.log('\n=== Test 2: Search for "Test" ===');
    const result2 = await mcpClient.findCustomerByName('Test');
    console.log('Result:', JSON.stringify(result2, null, 2));

    // Test 3: Search for "Ole"
    console.log('\n=== Test 3: Search for "Ole" ===');
    const result3 = await mcpClient.findCustomerByName('Ole');
    console.log('Result:', JSON.stringify(result3, null, 2));

    // Test 4: Search for non-existent customer
    console.log('\n=== Test 4: Search for "NonExistent Customer" ===');
    const result4 = await mcpClient.findCustomerByName('NonExistent Customer');
    console.log('Result:', JSON.stringify(result4, null, 2));

  } catch (error) {
    console.error('Error testing customer search:', error);
  }
}

testCustomerSearch();