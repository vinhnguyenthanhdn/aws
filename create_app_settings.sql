-- Create app_settings table for global configuration
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert initial value for gemini key index if not exists
INSERT INTO app_settings (key, value, description)
VALUES ('gemini_key_index', '0', 'Index of the last successfully used Gemini API key')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS (optional, but good practice if exposed)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (since this is an internal tool likely, or adjust policies as needed)
-- For simplicity in this context (assuming authenticated users or public app with backend logic):
CREATE POLICY "Allow public access" ON app_settings FOR ALL USING (true) WITH CHECK (true);
