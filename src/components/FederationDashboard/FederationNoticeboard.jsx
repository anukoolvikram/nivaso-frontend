// src/components/FederationNoticeboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../LoadingSpinner';
import CircularProgress from '@mui/material/CircularProgress';

const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours   = Math.floor(diffMs / (1000 * 60 * 60));
  const days    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks   = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24)   return `${hours} hour${hours   !== 1 ? 's' : ''} ago`;
  if (days < 7)     return `${days} day${days     !== 1 ? 's' : ''} ago`;
  return `${weeks} week${weeks   !== 1 ? 's' : ''} ago`;
};

const noticeTypes = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'notice',       label: '📄 Notice' },
  { value: 'poll',         label: '📊 Poll' },
];

export default function FederationNoticeboard() {
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    federation_id: '',
    type: 'announcement',
    images: []          // **NEW** will hold Cloudinary URLs
  });
  const [viewingNotice, setViewingNotice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // **NEW** raw File objects and uploaded URLs
  const [selectedImages, setSelectedImages] = useState([]);   // File[]
  const [uploadedUrls, setUploadedUrls] = useState([]);       // string[]

  const showToast = useToast();

  // On mount, grab federation_id from JWT and fetch notices
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setFormData(prev => ({ ...prev, federation_id: decoded.id }));
      fetchNotices(decoded.id);
    }
  }, []);

  // Fetch all notices for this federation, including images
  const fetchNotices = async (federation_id) => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/notices/federation-notice/get/${federation_id}`
      );
      setNotices(res.data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
      showToast('Failed to load notices', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setViewingNotice(null);
    setShowForm(false);
    setEditing(false);
    setConfirmUpdate(false);
    setSelectedImages([]);
    setUploadedUrls([]);
  };

  // Handle form field changes (title/description/type)
  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // **NEW**: capture file selections
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  // **NEW**: upload selectedImages to Cloudinary, return array of secure URLs
  const uploadImagesToCloudinary = async () => {
    if (!selectedImages.length) return [];

    const uploadPromises = selectedImages.map(file => {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); 
      // optional: form.append('folder', 'federation_notices');

      return axios
        .post(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, form)
        .then(res => res.data.secure_url);
    });

    return Promise.all(uploadPromises);
  };

  // Handle create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // 1) Upload images first
      const imageUrls = await uploadImagesToCloudinary();
      setUploadedUrls(imageUrls);

      // 2) Build final payload including those URLs
      const payload = {
        ...formData,
        images: imageUrls
      };

      if (editing) {
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/notices/federation-notice/update/${formData.id}`,
          payload
        );
        showToast('Notice updated!');
      } else {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/notices/federation-notice/post`,
          payload
        );
        showToast('Notice posted!');
      }

      // 3) Refresh and reset
      fetchNotices(formData.federation_id);
      handleBack();
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        type: 'announcement',
        images: []
      }));
    } catch (err) {
      console.error(err);
      showToast('Failed to submit notice', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (notice) => {
    // Preload everything into form
    setFormData({
      id: notice.id,
      title: notice.title,
      description: notice.description,
      federation_id: notice.federation_id,
      type: notice.type,
      images: notice.images || []
    });
    setUploadedUrls(notice.images || []);
    setSelectedImages([]);
    setViewingNotice(null);
    setEditing(true);
    setShowForm(true);
  };

  const handleView = (notice) => {
    setViewingNotice(notice);
    setShowForm(false);
    setEditing(false);
  };

  return (
    <div className="w-full mx-auto">
      <div className="flex justify-start gap-3 mb-4 items-center">
        {(viewingNotice || showForm) && (
          <button onClick={handleBack} className="text-gray-700 hover:text-black transition">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        )}

        {!viewingNotice && !showForm && (
          <div className="w-full flex justify-end">
            <button
              onClick={() => {
                setShowForm(true);
                setEditing(false);
              }}
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-medium px-4 py-2 rounded shadow-sm transition"
            >
              Write Notice
            </button>
          </div>
        )}
      </div>

      {/* Write / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 shadow-md p-6 rounded-xl mb-8 space-y-6"
        >
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Notice Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full border rounded-md px-4 py-2 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="w-full border rounded-md px-4 py-2 h-32 resize-none text-sm"
            />
          </div>

          {/* Type */}
          <div className="space-y-1">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Notice Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full border rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {noticeTypes.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* **NEW**: Image Picker */}
          <div className="space-y-1">
            <label htmlFor="images" className="block text-sm font-medium text-gray-700">
              Attach Images
            </label>
            <input
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            {selectedImages.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {selectedImages.length} file{selectedImages.length > 1 ? 's' : ''} selected
              </div>
            )}
            {/* Show already‐uploaded URLs if editing */}
            {uploadedUrls.length > 0 && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {uploadedUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`notice-img-${idx}`}
                    className="rounded shadow-sm object-cover w-full h-32"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Update Checkbox (if editing) */}
          {editing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirmUpdate"
                checked={confirmUpdate}
                onChange={() => setConfirmUpdate(prev => !prev)}
                className="w-4 h-4"
              />
              <label htmlFor="confirmUpdate" className="text-sm text-gray-700 ml-2">
                I confirm that I want to save these changes
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-5 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(editing && !confirmUpdate) || isLoading}
              className={`flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-md shadow-sm transition ${
                (editing && !confirmUpdate) || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-teal-700'
              }`}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : editing ? (
                'Update Notice'
              ) : (
                'Post Notice'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Notice List */}
      {!viewingNotice && !showForm && (
        <>
          {isLoading ? (
            <LoadingSpinner />
          ) : notices.length === 0 ? (
            <div className="text-gray-500">No Notices to display.</div>
          ) : (
            <div className="space-y-4">
              {notices.map(notice => (
                <div
                  key={notice.id}
                  onClick={() => handleView(notice)}
                  className="border p-4 rounded shadow hover:shadow-md hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex justify-between mb-2">
                    <div className="text-lg font-semibold text-gray-800">{notice.title}</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="p-2 bg-blue-100 text-blue-800 rounded text-xs">
                        {noticeTypes.find(t => t.value === notice.type)?.label || notice.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 italic">
                    {getTimeAgo(notice.date_posted)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Single Notice View */}
      {viewingNotice && (
        <div className="bg-white border border-gray-200 p-4 rounded shadow-md">
          <div className="flex justify-between mb-2">
            <div className="text-2xl font-semibold text-gray-800">
              {viewingNotice.title}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="p-2 bg-blue-100 text-blue-800 rounded text-xs">
                {noticeTypes.find(t => t.value === viewingNotice.type)?.label || viewingNotice.type}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-4">
            Posted on {new Date(viewingNotice.date_posted).toLocaleString()}
          </div>

          {/* **NEW**: Show attached images if any */}
          {Array.isArray(viewingNotice.images) && viewingNotice.images.length > 0 && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {viewingNotice.images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`notice-${viewingNotice.id}-img-${idx}`}
                  className="rounded shadow-sm object-cover w-full h-48"
                />
              ))}
            </div>
          )}

          <div className="prose max-w-none text-gray-800 leading-relaxed mb-6">
            {viewingNotice.description}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleEdit(viewingNotice)}
              className="bg-teal-500 hover:bg-teal-400 text-white font-medium px-4 py-2 rounded-md"
            >
              Edit Notice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
