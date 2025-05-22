import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gglvftzglwkhjojvapox.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbHZmdHpnbHdraGpvanZhcG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4OTk0MDYsImV4cCI6MjA2MzQ3NTQwNn0.V6mc04zOQcrxKQjBz0xlelNfOr45Fgx6L-Vm7qHPAoU';
export const supabase = createClient(supabaseUrl, supabaseKey); 