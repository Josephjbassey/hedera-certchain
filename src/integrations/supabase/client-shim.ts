// Shim for broken Supabase types - use manual-client.ts instead
// This file prevents build errors while Supabase regenerates types
export { supabase } from './manual-client';
