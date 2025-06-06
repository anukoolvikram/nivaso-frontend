import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import { CircularProgress } from '@mui/material';

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
  if (days    < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
};

const SocietyCommunity = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const showToast = useToast();

  // **NEW**: state for image uploads
  const [selectedImages, setSelectedImages] = useState([]);      // File[] picked by user
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]); // cloudinary secure URLs

  const token = localStorage.getItem('token');
  let decoded = token ? jwtDecode(token) : null;

  // **NEW**: helper to upload files to Cloudinary
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

  // **NEW**: capture file selection
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
        const fetchedBlogs = response.data || [];

        // Enrich each blog with author_name and editable flag
        const blogsWithAuthors = await Promise.all(
          fetchedBlogs.map(async (blog) => {
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
              editable: blog.by_admin === true,
              author_name: authorName
            };
          })
        );

        setBlogs(blogsWithAuthors);
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
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleEditClick = (blog) => {
    setTitle(blog.title);
    setContent(blog.content);
    setSelectedTags(blog.tags || []);
    setSelectedBlog(blog);
    setIsEditing(true);
    setShowForm(true);

    // Preload existing image URLs for editing
    setUploadedImageUrls(blog.images || []);
    setSelectedImages([]); // clear raw File state
  };

  const handleBlogSubmit = async () => {
    if (!title.trim() || !content.trim() || selectedTags.length === 0) {
      showToast('Please enter title, content, and select at least one tag.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      // 1) Upload new images first
      const imageUrls = await uploadImagesToCloudinary();
      // Combine any pre-existing URLs (in case of editing) with newly uploaded ones
      const allImageUrls = isEditing
        ? [...(uploadedImageUrls || []), ...imageUrls]
        : imageUrls;
      setUploadedImageUrls(allImageUrls);

      let response;
      if (isEditing && selectedBlog) {
        // Update existing blog
        response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/blogs/update-blog/${
            selectedBlog.post_id || selectedBlog.id
          }`,
          {
            title,
            content,
            tags: selectedTags,
            images: allImageUrls
          }
        );
      } else {
        // Create new blog
        const newBlog = {
          title,
          content,
          tags: selectedTags,
          society_code: decoded?.society_code,
          images: imageUrls
        };
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/blogs/add-admin-blog`,
          { blog: newBlog }
        );
      }

      if (response.data.success) {
        const updatedBlog = response.data.blog || response.data;
        if (isEditing) {
          const updated = {
            ...selectedBlog,
            title,
            content,
            tags: selectedTags,
            images: allImageUrls,
            editable: true,
            author_name: selectedBlog.author_name || decoded?.name || 'Community Member',
            post_date: updatedBlog.post_date || new Date().toISOString()
          };
          setBlogs((prev) =>
            prev.map((b) =>
              (b.id === selectedBlog.id || b.post_id === selectedBlog.id) ? updated : b
            )
          );
          setSelectedBlog(updated);
        } else {
          // Prepend new blog to the list
          const newEntry = {
            id: updatedBlog.id || updatedBlog.post_id,
            title: title.trim(),
            content: content.trim(),
            tags: selectedTags,
            images: imageUrls,
            editable: true,
            author_name: decoded?.name || 'Admin',
            post_date: updatedBlog.post_date || new Date().toISOString()
          };
          setBlogs((prev) => [newEntry, ...prev]);
        }
        resetForm();
        showToast(isEditing ? 'Blog updated successfully!' : 'Blog posted!');
      } else {
        setError(response.data.error || 'Failed to submit blog');
      }
    } catch (err) {
      console.error('Error submitting blog:', err);
      const message =
        err?.response?.data?.message || err?.response?.data?.error || 'Failed to submit blog.';
      showToast(message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setSelectedBlog(null);
    setIsEditing(false);
    setShowForm(false);
    setConfirmUpdate(false);
    setSelectedImages([]);
    setUploadedImageUrls([]);
  };

  const confirmDeleteBlog = (blogId) => {
    setBlogToDelete(blogId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!blogToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/blogs/delete-blog/${blogToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBlogs((prev) => prev.filter((b) =>
          b.id !== blogToDelete && b.post_id !== blogToDelete
        ));
        showToast('Blog deleted successfully!');
        if (
          selectedBlog &&
          (selectedBlog.id === blogToDelete || selectedBlog.post_id === blogToDelete)
        ) {
          setSelectedBlog(null);
        }
      } else {
        setError(response.data.error || 'Failed to delete blog');
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
      const message =
        err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete blog';
      showToast(message, 'error');
    } finally {
      setShowDeleteDialog(false);
      setBlogToDelete(null);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && <div className="mb-4 text-red-700">{error}</div>}

      {/* LIST / “Write Blog” BUTTON */}
      {!showForm && !selectedBlog && (
        <div>
          <div className="flex justify-end">
            <button
              className="mb-4 px-4 py-2 font-medium bg-teal-500 text-white hover:bg-teal-400 transition"
              onClick={() => setShowForm(true)}
            >
              Write Blog
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : blogs.length === 0 ? (
            <div className="text-center text-gray-500">No blogs yet. Write your first blog!</div>
          ) : (
            <ul className="p-0 space-y-4">
              {blogs.map((blog) => (
                <li
                  key={blog.post_id || blog.id}
                  className="p-4 border cursor-pointer rounded-md hover:bg-gray-100 transition shadow-sm"
                  onClick={() => setSelectedBlog(blog)}
                >
                  <div className="flex justify-between">
                    <div className="text-2xl font-semibold mb-2">{blog.title}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {blog.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 italic">{getTimeAgo(blog.post_date)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {(showForm || isEditing) && (
        <div className="space-y-4 bg-white p-3 border rounded-lg shadow-md">
          <div className="text-lg font-semibold">
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </div>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 mb-2 border"
          />

          <textarea
            placeholder="Write your blog..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full p-2 border"
          />

          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
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

          {/* IMAGE UPLOAD FIELD */}
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

          {isEditing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirmUpdate"
                checked={confirmUpdate}
                onChange={() => setConfirmUpdate((prev) => !prev)}
                className="w-4 h-4"
              />
              <label htmlFor="confirmUpdate" className="text-sm ml-2 text-gray-700">
                I confirm that I want to save these changes
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={handleBlogSubmit}
              disabled={
                submitLoading ||
                !title.trim() ||
                !content.trim() ||
                selectedTags.length === 0 ||
                (isEditing && !confirmUpdate)
              }
              className={`px-4 py-2 flex items-center gap-2 ${
                isEditing && !confirmUpdate
                  ? 'bg-teal-300 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-400'
              } text-white transition`}
            >
              {submitLoading ? <CircularProgress size={20} color="inherit" /> : isEditing ? 'Update' : 'Submit'}
            </button>

            <button onClick={resetForm} className="px-4 py-2 bg-gray-500 text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* VIEW A BLOG */}
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
              {selectedBlog.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-4">
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

          {/* DISPLAY IMAGES IF ANY */}
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

          <div className="flex justify-end gap-2 mt-2">
            {selectedBlog.editable && (
              <button
                onClick={() => handleEditClick(selectedBlog)}
                className="px-3 py-1 bg-teal-500 text-white hover:bg-teal-400 text-sm"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => confirmDeleteBlog(selectedBlog.post_id || selectedBlog.id)}
              className="px-3 py-1 bg-gray-500 text-white hover:bg-gray-400 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 shadow-xl w-full max-w-sm text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
            <p className="text-gray-600">Are you sure you want to delete this blog post?</p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setBlogToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-500 flex items-center justify-center gap-2"
                disabled={deleteLoading}
              >
                {deleteLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyCommunity;
