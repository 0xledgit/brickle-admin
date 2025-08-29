'use client';

import { useState, useRef } from 'react';
import { FileResponseDto } from '@/lib/types';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<FileResponseDto>;
  entityType: 'Leasing' | 'Campaign';
  propertyName: 'Cover' | 'Miniature';
  currentUrl?: string;
  disabled?: boolean;
}

export default function FileUpload({ 
  onFileUpload, 
  entityType, 
  propertyName, 
  currentUrl,
  disabled = false 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentUrl || '');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedFormat = `${entityType}.${propertyName}.{extension}`;
  const exampleFormat = `${entityType}.${propertyName}.png`;

  const validateFileName = (fileName: string): boolean => {
    const pattern = new RegExp(`^${entityType}\\.${propertyName}\\.(jpg|jpeg|png|gif|bmp|webp)$`, 'i');
    return pattern.test(fileName);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file name format
    if (!validateFileName(file.name)) {
      setError(`File name must follow the format: ${expectedFormat}`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const result = await onFileUpload(file);
      setUploadedUrl(result.fileUrl);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {propertyName} Image
        </label>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          {uploadedUrl ? (
            <div className="space-y-2">
              <div className="text-sm text-green-600">✓ File uploaded successfully</div>
              <div className="text-xs text-gray-500 break-all">{uploadedUrl}</div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Change file
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="text-gray-600 hover:text-gray-700"
            >
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </button>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
        <div className="font-medium mb-1">File naming requirements:</div>
        <div>Format: <code className="bg-white px-1 rounded">{expectedFormat}</code></div>
        <div>Example: <code className="bg-white px-1 rounded">{exampleFormat}</code></div>
        <div className="mt-1">Supported formats: JPG, PNG, GIF, BMP, WebP (max 10MB)</div>
      </div>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}