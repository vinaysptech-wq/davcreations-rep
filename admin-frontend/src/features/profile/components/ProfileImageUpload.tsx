"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Button from '../../../components/ui/button/Button';
import { useProfile } from '../hooks/useProfile';
import { validateImageFile } from '../utils/profileValidation';
import type { Profile } from '../types/profile';

interface ProfileImageUploadProps {
  profile: Profile;
  onUpdate: (data: Partial<Profile>) => Promise<void>;
}

export default function ProfileImageUpload({ profile, onUpdate }: ProfileImageUploadProps) {
  const { uploadImage, updating } = useProfile();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validationErrors = validateImageFile(file);
    if (validationErrors.length > 0) {
      alert(validationErrors[0].message);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      await uploadImage(formData);
      // Refresh profile data
      window.location.reload();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      await onUpdate({ image: undefined });
      window.location.reload();
    } catch (error) {
      console.error('Error removing image:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Profile Picture
      </h2>

      <div className="space-y-4">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {profile.image ? (
            <div className="space-y-4">
              <div className="relative w-32 h-32 mx-auto">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${profile.image}`}
                  alt="Profile"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop a new image or click to browse
                </p>
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClick}
                    disabled={uploading || updating}
                  >
                    Change Picture
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveImage}
                    disabled={uploading || updating}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Upload Profile Picture
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Drag and drop an image here, or click to browse
                </p>
                <Button
                  onClick={handleClick}
                  disabled={uploading || updating}
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Supported formats: JPEG, PNG, GIF</p>
          <p>Maximum file size: 5MB</p>
        </div>
      </div>
    </div>
  );
}