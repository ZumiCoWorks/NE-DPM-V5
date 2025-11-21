-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload floorplans" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read floorplans" ON storage.objects;

-- Allow authenticated users to upload to floorplans bucket
CREATE POLICY "Authenticated users can upload floorplans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'floorplans');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update floorplans"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'floorplans');

-- Allow public read access to floorplans
CREATE POLICY "Public can read floorplans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'floorplans');
