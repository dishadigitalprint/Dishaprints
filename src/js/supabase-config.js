/**
 * Supabase Configuration
 * Disha Digital Prints Database Integration
 */

const SUPABASE_URL = 'https://noerqtwbyqeunjvnzlmg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZXJxdHdieXFldW5qdm56bG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzI4NzUsImV4cCI6MjA3ODk0ODg3NX0.h7-61oV4uhYG9CHDwrAEU1TKAEXpJNem4fl8bDiLLIY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test connection on load
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase connected successfully!');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        console.log('💡 Make sure you have run the SQL schema in Supabase SQL Editor');
        return false;
    }
}

// Export for use in other files
window.supabaseClient = supabase;
window.testSupabaseConnection = testSupabaseConnection;

console.log('🔗 Supabase config loaded');
