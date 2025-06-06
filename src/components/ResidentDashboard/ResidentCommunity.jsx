// src/components/ResidentCommunity.jsx
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // use named import
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext'; 
import LoadingSpinner from '../LoadingSpinner';
import CircularProgress from '@mui/material/CircularProgress';

const TAGS = ['Event', 'Buy & Sell', 'Awareness', 'Advertisement'];

const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours   = Math.floor(diffMs / (1000 * 60 * 60));
  const days    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks   = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  if (hours   < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days    < 7) return `${days} day${days    !== 1 ? 's' : ''} ago`;
  return `${weeks} week${weeks  !== 1 ? 's' : ''} ago`;
};

const ResidentCommunity = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMyBlogs, setShowMyBlogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // **NEW**: For image uploads
  const [selectedImages, setSelectedImages] = useState([]);       // raw File objects
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]); // Cloudinary URLs

  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;

  // **NEW**: upload to Cloudinary
  const uploadImagesToCloudinary = async () => {
    if (!selectedImages.length) return [];

    const uploadPromises = selectedImages.map(file => {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);     
      return axios
        .post(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, form)
        .then(res => res.data.secure_url);
    });

    return Promise.all(uploadPromises);
  };

  // **NEW**: file-picker handler
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/blogs/all-blogs`,
          { params: { society_code: decoded?.society_code } }
        );
        const fetched = response.data || [];

        // Enrich with author_name and editable flag
        const enriched = await Promise.all(
          fetched.map(async blog => {
            let authorName = 'Committee Member';
            if (blog.author_id) {
              try {
                const authorRes = await axios.get(
                  `${import.meta.env.VITE_BACKEND_URL}/blogs/author-name/${blog.author_id}`
                );
                authorName = authorRes.data?.author_name || 'Unknown';
              } catch {
                authorName = 'Unknown';
              }
            }
            return {
              ...blog,
              editable: decoded?.id === blog.author_id,
              author_name: authorName
            };
          })
        );

        setBlogs(enriched);
        setError(null);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Failed to load blogs. Please try again.');
        showToast('Failed to load blogs. Please try again.', 'error');
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    if (decoded?.society_code) {
      fetchBlogs();
    }
  }, [decoded?.society_code, showToast]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleEditClick = (blog) => {
    setTitle(blog.title);
    setContent(blog.content);
    setSelectedTags(blog.tags || []);
    setSelectedBlog(blog);
    setIsEditing(true);
    setShowForm(true);

    // Preload existing image URLs
    setUploadedImageUrls(blog.images || []);
    setSelectedImages([]); // clear raw Files
  };

  const handleBlogSubmit = async () => {
    if (!title.trim() || !content.trim() || selectedTags.length === 0) {
      showToast('Please enter title, content, and select at least one tag.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1) Upload new images
      const newUrls = await uploadImagesToCloudinary();
      // Combine with existing ones (when editing)
      const allUrls = isEditing
        ? [...(uploadedImageUrls || []), ...newUrls]
        : newUrls;
      setUploadedImageUrls(allUrls);

      let response;
      if (isEditing && selectedBlog) {
        // Update existing blog
        response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/blogs/update-blog/${selectedBlog.id}`,
          {
            title,
            content,
            tags: selectedTags,
            images: allUrls
          }
        );
      } else {
        // Create new blog
        const newBlog = {
          title,
          content,
          tags: selectedTags,
          author: decoded?.id,
          society_id: decoded?.society_code,
          images: allUrls
        };
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/blogs/add-blog`,
          { blog: newBlog }
        );
      }

      if (response.data.success) {
        showToast(isEditing ? 'Blog updated successfully!' : 'Blog posted!');
        resetForm();

        // Refresh entire list
        const refreshed = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/blogs/all-blogs`,
          { params: { society_code: decoded?.society_code } }
        );
        const enriched = await Promise.all(
          refreshed.data.map(async blog => {
            let authorName = 'Committee Member';
            if (blog.author_id) {
              try {
                const authorRes = await axios.get(
                  `${import.meta.env.VITE_BACKEND_URL}/blogs/author-name/${blog.author_id}`
                );
                authorName = authorRes.data?.author_name || 'Unknown';
              } catch {
                authorName = 'Unknown';
              }
            }
            return {
              ...blog,
              editable: decoded?.id === blog.author_id,
              author_name: authorName
            };
          })
        );
        setBlogs(enriched);
      } else {
        setError(response.data.error || 'Failed to submit blog');
      }
    } catch (err) {
      console.error('Error submitting blog:', err);
      const message =
        err?.response?.data?.message || err?.response?.data?.error || 'Failed to submit blog.';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setSelectedBlog(null);
    setIsEditing(false);
    setShowForm(false);
    setSelectedImages([]);
    setUploadedImageUrls([]);
  };

  const filteredBlogs = showMyBlogs
    ? blogs.filter(blog => blog.editable)
    : blogs;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full">
      {error && <div className="mb-4 text-red-700">{error}</div>}

      {!showForm && !selectedBlog && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              className="px-4 py-2 font-medium border hover:bg-gray-100"
              onClick={() => setShowMyBlogs(prev => !prev)}
            >
              {showMyBlogs ? 'View All Blogs' : 'My Blogs'}
            </button>

            <button
              className="px-4 py-2 font-medium bg-teal-500 text-white hover:bg-teal-400 transition"
              onClick={() => setShowForm(true)}
            >
              Write Blog
            </button>
          </div>

          {filteredBlogs.length === 0 ? (
            <div className="text-center text-gray-500">No blogs found.</div>
          ) : (
            <ul className="p-0 space-y-4">
              {filteredBlogs.map(blog => (
                <li
                  key={blog.id}
                  className="p-4 border cursor-pointer rounded-md hover:bg-gray-100 transition shadow-sm"
                  onClick={() => setSelectedBlog(blog)}
                >
                  <div className="flex justify-between">
                    <div className="text-2xl font-semibold mb-2">{blog.title}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {blog.tags?.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 italic">
                    {getTimeAgo(blog.post_date)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(showForm || isEditing) && (
        <div className="space-y-4 bg-white p-3 border rounded-lg shadow-md">
          <div className="text-lg font-semibold">
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </div>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
          />

          <textarea
            placeholder="Write your blog..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            className="w-full p-2 border rounded"
          />

          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 mt-2 rounded-full border text-sm ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* **NEW**: Image upload field */}
          <div className="space-y-1 mt-4">
            <label htmlFor="blog-images" className="block text-sm font-medium text-gray-700">
              Attach Images
            </label>
            <input
              id="blog-images"
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
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleBlogSubmit}
              disabled={
                submitting ||
                !title.trim() ||
                !content.trim() ||
                selectedTags.length === 0
              }
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                isEditing ? 'Update' : 'Submit'
              )}
            </button>

            <button onClick={resetForm} className="px-4 py-2 bg-gray-500 text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedBlog && !isEditing && (
        <div className="mt-4 border p-6 rounded-lg bg-white shadow-sm">
          <button
            onClick={() => setSelectedBlog(null)}
            className="mb-2 text-gray-700 hover:text-black transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex justify-between">
            <div className="text-2xl font-semibold">{selectedBlog.title}</div>
            <div className="flex flex-wrap p-2 gap-2">
              {selectedBlog.tags?.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-4 -mt-2">
            Posted on{' '}
            {new Date(selectedBlog.post_date).toLocaleString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>

          {/* **NEW**: Display images */}
          {selectedBlog.images && selectedBlog.images.length > 0 && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {selectedBlog.images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`blog-${selectedBlog.id}-img-${idx}`}
                  className="rounded shadow-sm object-cover w-full h-48"
                />
              ))}
            </div>
          )}

          <div className="prose max-w-none">
            {selectedBlog.content.split('\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="flex justify-end mt-6 mb-4 pt-1 border-t text-sm text-gray-500">
            Posted by: {selectedBlog.author_name || 'Anonymous'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentCommunity;
