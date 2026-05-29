import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://miarxrdrbmyllxhfjzbn.supabase.co';
const supabaseKey = 'sb_publishable_BBIVOX6MZoViIzulTgjmHg_MchW89Q3';
export const supabase = createClient(supabaseUrl, supabaseKey);