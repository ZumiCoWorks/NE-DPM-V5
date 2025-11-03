import React, { useState, useRef } from 'react';

// ImageUploader (scaffold copy)
// - onUploadSuccess(url, { width, height }) is called when upload completes
// - uploadFn(file) => Promise<string> can be provided to handle storage (returns public URL)
// If uploadFn is not provided the component will fall back to asking for a hosted URL via prompt()

const ImageUploader = ({ onUploadSuccess, onMessage = () => {}, uploadFn }) => {
  const [uploading, setUploading] = useState(false);
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
      onMessage('Please select an image to upload.', 'warning');
      return;
    }
    setUploading(true);

    const image = new window.Image();
    image.src = URL.createObjectURL(file);
    image.onload = async () => {
      const dimensions = { width: image.width, height: image.height };
      try {
        if (uploadFn) {
          const publicUrl = await uploadFn(file);
          onUploadSuccess(publicUrl, dimensions);
          setFile(null);
          setPreviewUrl(null);
          onMessage('Floorplan image uploaded successfully!', 'success');
        } else {
          // Fallback: ask the dev to paste a hosted URL
          const url = window.prompt('Enter hosted image URL (or cancel):');
          if (url) {
            onUploadSuccess(url, dimensions);
            setFile(null);
            setPreviewUrl(null);
            onMessage('Floorplan image URL accepted', 'success');
          } else {
            onMessage('Upload cancelled', 'warning');
          }
        }
      } catch (err) {
        console.error('Upload error:', err?.message || err);
        onMessage('File upload failed: ' + (err?.message || String(err)), 'error');
      } finally {
        setUploading(false);
        URL.revokeObjectURL(image.src);
      }
    };
    image.onerror = () => {
      onMessage('Could not read image file to get dimensions.', 'error');
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

  const triggerFileSelect = () => fileInputRef.current && fileInputRef.current.click();

  const dropZoneStyle = {
    position: 'relative',
    width: '100%',
    height: '200px',
    border: `2px dashed ${isDragging ? '#1d4ed8' : '#e5e7eb'}`,
    borderRadius: '0.75rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
    backgroundColor: isDragging ? 'rgba(29, 78, 216, 0.06)' : 'transparent',
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
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <svg style={{ margin: '0 auto', height: '3rem', width: '3rem' }} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ marginTop: '0.5rem' }}>Drag & drop your image here</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>or <span style={{ fontWeight: '600', color: '#1d4ed8' }}>click to browse</span></p>
        </div>
      </div>

      {previewUrl && (
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
        </div>
      )}

      {file && (
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.9em', color: '#111827', margin: 0, fontWeight: 500 }}>Selected: {file.name}</p>
          <button onClick={handleUpload} disabled={uploading} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
