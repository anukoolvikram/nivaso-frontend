import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext';

const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
};

const noticeTypes = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'notice', label: '📄 Notice' },
  { value: 'poll', label: '📊 Poll' },
];

const FederationNoticeboard = () => {
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    federation_id: '',
    type: 'announcement'
  });
  const [viewingNotice, setViewingNotice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  const showToast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setFormData((prev) => ({ ...prev, federation_id: decoded.id }));
      fetchNotices(decoded.id);
    }
  }, []);

  const fetchNotices = async (federation_id) => {
    try {
      const res = await axios.get(`http://localhost:5000/notices/federation-notice/get/${federation_id}`);
      setNotices(res.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
      showToast('Failed to load notices', 'error');
    }
  };

  const handleBack = () => {
    setViewingNotice(null);
    setShowForm(false);
    setEditing(false);
    setConfirmUpdate(false);
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/notices/federation-notice/edit/${formData.id}`, formData);
        showToast('Notice updated!');
      } else {
        await axios.post(`http://localhost:5000/notices/federation-notice/post`, formData);
        showToast('Notice posted!');
      }
      fetchNotices(formData.federation_id);
      handleBack();
      setFormData((prev) => ({ ...prev, title: '', description: '', type: 'announcement' }));
    } catch (err) {
      console.error(err);
      showToast('Failed to submit notice', 'error');
    }
  };

  const handleEdit = (notice) => {
    setFormData(notice);
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
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(false);
            }}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-medium px-4 py-2 rounded-md shadow-sm transition"
          >
            Write Notice
          </button>
        )}
      </div>

      {/* Write Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white border border-gray-200 shadow-md p-6 rounded-xl mb-8 space-y-6"
        >
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

          <div className="space-y-1">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Notice Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {noticeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {editing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirmUpdate"
                checked={confirmUpdate}
                onChange={() => setConfirmUpdate((prev) => !prev)}
                className="w-4 h-4"
              />
              <label htmlFor="confirmUpdate" className="text-sm text-gray-700 ml-2">
                I confirm that I want to save these changes
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-5 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editing && !confirmUpdate}
              className={`bg-teal-600 text-white font-medium px-5 py-2 rounded-md shadow-sm transition ${
                editing && !confirmUpdate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'
              }`}
            >
              {editing ? 'Update Notice' : 'Post Notice'}
            </button>
          </div>
        </form>
      )}

      {!viewingNotice && !showForm && notices.length === 0 && (
        <div className="text-gray-500">No Notices to display.</div>
      )}

      {/* View Notice */}
      {viewingNotice && (
        <div className="bg-white border border-gray-200 p-4 rounded shadow-md">
          <div className="flex justify-between mb-2">
            <div className="text-2xl font-semibold text-gray-800">{viewingNotice.title}</div>
            <div className="flex flex-wrap gap-2">
              <span className="p-2 bg-blue-100 text-blue-800 rounded text-xs">
                {noticeTypes.find((t) => t.value === viewingNotice.type)?.label || viewingNotice.type}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Posted on {new Date(viewingNotice.date_posted).toLocaleString()}
          </div>
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

      {/* Notice List */}
      {!viewingNotice && !showForm && (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => handleView(notice)}
              className="border p-4 rounded shadow hover:shadow-md hover:bg-gray-100 cursor-pointer"
            >
              <div className="flex justify-between mb-2">
                <div className="text-lg font-semibold text-gray-800">{notice.title}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="p-2 bg-blue-100 text-blue-800 rounded text-xs">
                    {noticeTypes.find((t) => t.value === notice.type)?.label || notice.type}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 italic">{getTimeAgo(notice.date_posted)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FederationNoticeboard;
