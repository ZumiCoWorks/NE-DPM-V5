// src/components/ImageUploader.jsx
import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const ImageUploader = ({ onUploadSuccess, onMessage }) => {
  const [uploading, setUploading] =useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onMessage("Please select an image to upload.", 'warning');
      return;
    }
    setUploading(true);

    const image = new window.Image();
    image.src = URL.createObjectURL(file);
    image.onload = async () => {
      const dimensions = { width: image.width, height: image.height };
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('floorplans')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('floorplans')
          .getPublicUrl(uploadData.path);

        if (publicUrlData?.publicUrl) {
          onUploadSuccess(publicUrlData.publicUrl, dimensions);
          setFile(null);
          setPreviewUrl(null);
          onMessage("Floorplan image uploaded successfully!", 'success');
        } else {
          throw new Error("Failed to get public URL for the uploaded file.");
        }
      } catch (err) {
        console.error("Upload error:", err.message);
        onMessage("File upload failed: " + err.message, 'error');
      } finally {
        setUploading(false);
        URL.revokeObjectURL(image.src);
      }
    };
    image.onerror = () => {
      onMessage("Could not read image file to get dimensions.", 'error');
      setUploading(false);
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    }
  };

  const triggerFileSelect = () => fileInputRef.current.click();

  const dropZoneStyle = {
    position: 'relative',
    width: '100%',
    height: '200px',
    border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
    borderRadius: '0.75rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
    backgroundColor: isDragging ? 'rgba(26, 115, 232, 0.1)' : 'transparent',
  };

  return (
    <div style={{
      background: 'linear-gradient(to bottom, rgba(240, 240, 240, 0.5), rgba(224, 224, 224, 0.5))',
      padding: '20px',
      borderRadius: '8px',
    }}>
      <h3 style={{ marginTop: 0, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '15px' }}>Upload New Floorplan</h3>

      <div
        style={dropZoneStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <svg style={{ margin: '0 auto', height: '3rem', width: '3rem' }} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ marginTop: '0.5rem' }}>Drag & drop your image here</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>or <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>click to browse</span></p>
        </div>
      </div>

      {previewUrl && (
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid var(--color-border-light)' }} />
        </div>
      )}

      {file && (
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.9em', color: 'var(--color-text-primary)', margin: 0, fontWeight: 500 }}>Selected: {file.name}</p>
          <button onClick={handleUpload} disabled={uploading} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

