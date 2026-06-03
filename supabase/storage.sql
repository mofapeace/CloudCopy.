-- Create documents bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
-- Anyone can upload files (for student upload)
CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Since the Node.js server uses the SUPABASE_SERVICE_ROLE_KEY to interact with Supabase,
-- it will bypass Row Level Security for reading and deleting files.
