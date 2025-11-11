import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  eventId: string;
  onUploadSuccess: (filePath: string) => void;
}

export const ImageUploader = ({ eventId, onUploadSuccess }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    if (!eventId) {
      setError('Event ID is missing.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `events/${eventId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('floorplans')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('floorplans')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Could not get public URL for the uploaded file.');
      }

      onUploadSuccess(publicUrl);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const removePreview = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 border-2 border-dashed rounded-lg text-center">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-md" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removePreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div {...getRootProps()} className="cursor-pointer p-10">
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          {isDragActive ? (
            <p className="mt-2 text-blue-500">Drop the file here ...</p>
          ) : (
            <p className="mt-2 text-gray-500">Drag 'n' drop a map image here, or click to select a file</p>
          )}
          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm mt-1">{progress}% uploaded</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <Button onClick={handleUpload} disabled={uploading || !file} className="mt-4">
        {uploading ? 'Uploading...' : 'Upload Map'}
      </Button>
    </div>
  );
};
