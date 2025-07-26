import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zymckzoomhwgbmzypijk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bWNrem9vbWh3Z2JtenlwaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzkyNzgsImV4cCI6MjA2OTA1NTI3OH0.6pOocnDlRhNKjDnbAF0hIkla7Dm9PgnxbwnKrJaMS6o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)