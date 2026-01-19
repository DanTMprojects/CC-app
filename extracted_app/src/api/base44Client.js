import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "693f2b0fad2888650e409c68", 
  requiresAuth: true // Ensure authentication is required for all operations
});
