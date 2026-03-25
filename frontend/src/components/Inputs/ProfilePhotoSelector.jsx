import React, { useState, useRef, useEffect, useContext } from "react";
import useT from "../../hooks/useT";
import { UserContext } from "../../context/UserContext";

const ProfilePhotoSelector = ({ photo, onUpload, onRemove }) => {
  const { prefs } = useContext(UserContext);
  const isDarkTheme = prefs?.theme === "dark";

  const { t } = useT();
  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const [preview, setPreview] = useState(photo || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(photo || null);
  }, [photo]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      await onUpload(file);
    } catch (err) {
      console.error(tt("profilePhoto.uploadFail", "Upload failed:"), err);
      alert(tt("profilePhoto.uploadFailAlert", "Failed to upload photo."));
      setPreview(photo || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div
          className={`w-32 h-32 rounded-full border-4 overflow-hidden flex items-center justify-center shadow-lg ${
            isDarkTheme ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
          }`}
        >
          {preview ? (
            <img
              src={preview}
              alt={tt("profilePhoto.alt", "Profile")}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`text-center ${isDarkTheme ? "text-gray-400" : "text-gray-400"}`}>
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm">{tt("profilePhoto.noPhoto", "No photo")}</span>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Changed to GREEN primary (no structural changes) */}
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className={`inline-flex items-center justify-center px-4 py-2.5 font-medium rounded-lg transition-colors duration-200 ${
            isDarkTheme
              ? `bg-primary hover:bg-primary-700 disabled:bg-primary-400 text-white`
              : `bg-primary hover:bg-primary-700 disabled:bg-primary-400 text-white`
          }`}
        >
          {isUploading
            ? tt("profile.uploading", "Uploading...")
            : preview
            ? tt("profile.changePhoto", "Change Photo")
            : tt("profile.uploadPhoto", "Upload Photo")}
        </button>

        {preview && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className={`inline-flex items-center justify-center px-4 py-2.5 font-medium rounded-lg transition-colors duration-200 ${
              isDarkTheme
                ? "bg-red-700 hover:bg-red-600 text-white"
                : "bg-white hover:bg-red-50 border border-red-300 text-red-700 hover:text-red-800"
            }`}
          >
            {tt("profile.removePhoto", "Remove Photo")}
          </button>
        )}
      </div>

      <p
        className={`text-sm text-center max-w-xs ${
          isDarkTheme ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {tt(
          "profile.helperText",
          "Choose a clear photo that represents you well. JPG, PNG, or GIF format."
        )}
      </p>
    </div>
  );
};

export default ProfilePhotoSelector;
