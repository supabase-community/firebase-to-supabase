import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { keys as supabasekeys } from './supabase-keys';
import * as fs from 'fs';

const supabase: SupabaseClient = createClient(supabasekeys.SUPABASE_URL, supabasekeys.SUPABASE_KEY);


async function main() {

    console.log('not implemented yet');
}
main();

