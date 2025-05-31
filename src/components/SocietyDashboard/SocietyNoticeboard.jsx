import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // kept as you had it
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import CircularProgress from '@mui/material/CircularProgress';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const minutes = Math.floor(diffMs / 60000);
  const hours   = Math.floor(diffMs / 3600000);
  const days    = Math.floor(diffMs / 86400000);
  const weeks   = Math.floor(diffMs / 604800000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  if (hours   < 24) return `${hours} hour${hours   !== 1 ? 's' : ''} ago`;
  if (days    < 7) return `${days} day${days    !== 1 ? 's' : ''} ago`;
  return `${weeks} week${weeks  !== 1 ? 's' : ''} ago`;
};

export default function SocietyNoticeboard() {
  const [notices, setNotices]                 = useState([]);
  const [pendingNotices, setPendingNotices]   = useState([]);
  const [federationNotices, setFederationNotices] = useState([]);
  const [viewingNotice, setViewingNotice]     = useState(null);
  const [showForm, setShowForm]               = useState(false);
  const [showingPending, setShowingPending]   = useState(false);
  const [showingFederation, setShowingFederation] = useState(false);
  const [editing, setEditing]                 = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'announcement',
    society_id: '',
    approved: true,
  });
  const [confirmUpdate, setConfirmUpdate]     = useState(false);

  // Loading flags
  const [loadingNotices, setLoadingNotices]       = useState(true);
  const [loadingPending, setLoadingPending]       = useState(true);
  const [loadingFederation, setLoadingFederation] = useState(true);
  const [submitting, setSubmitting]               = useState(false);
  const [approvingId, setApprovingId]             = useState(null);

  const showToast = useToast();

  const noticeTypes = [
    { value: 'announcement', label: '📢 Announcement' },
    { value: 'notice',       label: '📄 Notice' },
    { value: 'poll',         label: '📊 Poll' },
    { value: 'lost_and_found', label: '🧩 Lost & Found' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const decoded = jwtDecode(token);
    setFormData(f => ({ ...f, society_id: decoded.id }));
    fetchNotices(decoded.id);
    fetchPendingNotices(decoded.id);
    fetchFederationNotices(decoded.id);
  }, []);

  const fetchNotices = async (society_id) => {
    setLoadingNotices(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/notices/all-notices`,
        { params: { society_id } }
      );
      const approved = Array.isArray(data) ? data.filter(n => n.approved) : [];
      const enriched = await Promise.all(approved.map(async n => {
        if (!n.user_id) return { ...n, author_name: null, flat_id: null };
        try {
          const u = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/user-name/${n.user_id}`
          );
          return {
            ...n,
            author_name: u.data.author_name || 'Unknown',
            flat_id:      u.data.flat_id      || 'N/A',
          };
        } catch {
          return { ...n, author_name: 'Unknown', flat_id: 'N/A' };
        }
      }));
      setNotices(enriched);
    } catch {
      showToast("Failed to load approved notices", "error");
    }
    setLoadingNotices(false);
  };

  const fetchPendingNotices = async (society_id) => {
    setLoadingPending(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/notices/all-notices`,
        { params: { society_id } }
      );
      const unapproved = Array.isArray(data) ? data.filter(n => !n.approved) : [];
      const enriched = await Promise.all(unapproved.map(async n => {
        if (!n.user_id) return { ...n, author_name: 'System', flat_id: '—' };
        try {
          const u = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/notices/user-name/${n.user_id}`
          );
          return {
            ...n,
            author_name: u.data.author_name || 'Unknown',
            flat_id:      u.data.flat_id      || 'N/A',
          };
        } catch {
          return { ...n, author_name: 'Unknown', flat_id: 'N/A' };
        }
      }));
      setPendingNotices(enriched);
    } catch {
      showToast("Failed to load pending notices", "error");
    }
    setLoadingPending(false);
  };

  const fetchFederationNotices = async (userId) => {
    setLoadingFederation(true);
    try {
      const fedRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/notices/federation-id/${userId}`
      );
      const { federation_id } = fedRes.data;
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/notices/federation-notice/get/${federation_id}`
      );
      setFederationNotices(data);
    } catch {
      showToast('Failed to load federation notices', 'error');
    }
    setLoadingFederation(false);
  };

  const handleApprove = async (notice_id) => {
    setApprovingId(notice_id);
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/notices/approve-notice/${notice_id}`
      );
      showToast("Notice approved!");
      fetchNotices(formData.society_id);
      fetchPendingNotices(formData.society_id);
    } catch (err) {
      showToast(err.response?.data?.message || "Approval failed", "error");
    }
    setApprovingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/notices/edit-notice/${formData.notice_id}`,
          formData
        );
        showToast('Notice updated!');
      } else {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/notices/post-notice`,
          formData
        );
        showToast('Notice posted!');
      }
      setShowForm(false);
      setEditing(false);
      setViewingNotice(null);
      setFormData(f => ({ ...f, title: '', description: '' }));
      fetchNotices(formData.society_id);
      fetchPendingNotices(formData.society_id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Submit failed', 'error');
    }
    setSubmitting(false);
  };

  const handleEdit = (notice) => {
    setViewingNotice(null);
    setFormData({ ...notice });
    setEditing(true);
    setShowForm(true);
  };
  const handleView = (notice) => {
    setViewingNotice(notice);
    setShowForm(false);
    setEditing(false);
  };
  const handleBack = () => {
    setViewingNotice(null);
    setShowForm(false);
    setEditing(false);
    setShowingPending(false);
    setShowingFederation(false);
    setConfirmUpdate(false);
  };

  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="flex justify-start gap-3 mb-4 items-center">
        {(viewingNotice || showForm || showingPending || showingFederation) && (
          <button onClick={handleBack} className="text-gray-700 hover:text-black">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        )}
        {!showingPending && !showForm && !viewingNotice && !showingFederation && (
          <div className="w-full flex justify-between items-center flex-wrap gap-2 mb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setShowingPending(true);
                  setShowingFederation(false);
                }}
                className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow-sm transition"
              >
                Pending Notices
              </button>
              <button
                onClick={() => {
                  setShowingFederation(true);
                  setShowingPending(false);
                }}
                className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow-sm transition"
              >
                Federation Notices
              </button>
            </div>

            <button
              onClick={() => {
                setShowForm(true);
                setEditing(false);
              }}
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 shadow-sm transition"
            >
              Write Notice
            </button>
            </div>

        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border p-6 rounded-xl mb-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Notice Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter a short title"
              className="w-full border rounded px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              required
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border rounded px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {noticeTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write the full notice content here..."
              className="w-full border rounded px-4 py-2 h-32 resize-none text-sm focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {editing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirmUpdate"
                checked={confirmUpdate}
                onChange={() => setConfirmUpdate(!confirmUpdate)}
                className="w-4 h-4"
              />
              <label htmlFor="confirmUpdate" className="ml-2 text-sm text-gray-700">
                I confirm that I want to save these changes
              </label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="bg-white border hover:bg-gray-100 text-gray-700 px-5 py-2 rounded"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(editing && !confirmUpdate) || submitting}
              className={`flex items-center justify-center bg-teal-600 text-white px-5 py-2 rounded shadow-sm ${
                (editing && !confirmUpdate) || submitting ? 'opacity-50' : 'hover:bg-teal-700'
              }`}
            >
              {submitting ? (
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

      {/* Single Notice View */}
      {viewingNotice && !showForm && (
        <div className="bg-white border p-4 rounded shadow-md">
          <div className="flex justify-between mb-2">
            <h2 className="text-2xl font-semibold">{viewingNotice.title}</h2>
            <span className="p-2 bg-blue-100 text-blue-800 rounded text-xs">
              {noticeTypes.find(t => t.value === viewingNotice.type)?.label || viewingNotice.type}
            </span>
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Posted on{' '}
            {new Date(viewingNotice.date_posted).toLocaleString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
          <div className="prose max-w-none mb-6">{viewingNotice.description}</div>
          {viewingNotice.user_id && (
            <div className="flex justify-end mb-4 text-sm text-gray-500">
              Posted by:{' '}
              <strong className="ml-1 uppercase">
                {viewingNotice.author_name} ({viewingNotice.flat_id})
              </strong>
            </div>
          )}
          <div className="flex justify-end gap-3">
            {!showingFederation && (
              <button
                onClick={() => handleEdit(viewingNotice)}
                className="bg-teal-500 hover:bg-teal-400 text-white px-3 py-2 rounded"
                disabled={submitting}
              >
                Edit Notice
              </button>
            )}
            {showingPending && (
              <button
                onClick={e => { e.stopPropagation(); handleApprove(viewingNotice.notice_id); }}
                disabled={approvingId === viewingNotice.notice_id}
                className="flex items-center gap-1 bg-teal-500 hover:bg-teal-400 text-white px-3 py-2 rounded text-sm"
              >
                {approvingId === viewingNotice.notice_id ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Approve'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notice List */}
      {!viewingNotice && !showForm && (
        <div className="space-y-4 -mt-2">
          {showingPending ? (
            loadingPending ? (
              <LoadingSpinner />
            ) : pendingNotices.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No notice to show</div>
            ) : (
              pendingNotices.map(n => (
                <NoticeCard key={n.id} notice={n} onClick={() => handleView(n)} />
              ))
            )
          ) : showingFederation ? (
            loadingFederation ? (
              <LoadingSpinner />
            ) : federationNotices.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No notice to show</div>
            ) : (
              federationNotices.map(n => (
                <NoticeCard key={n.id} notice={n} onClick={() => handleView(n)} />
              ))
            )
          ) : loadingNotices ? (
            <LoadingSpinner />
          ) : notices.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No notice to show</div>
          ) : (
            notices.map(n => (
              <NoticeCard key={n.id} notice={n} onClick={() => handleView(n)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Simple card sub-component
function NoticeCard({ notice, onClick }) {
  const noticeTypes = {
    announcement: '📢 Announcement',
    notice:       '📄 Notice',
    poll:         '📊 Poll',
    lost_and_found:'🧩 Lost & Found'
  };
  return (
    <div
      onClick={onClick}
      className="border p-4 rounded shadow hover:shadow-md hover:bg-gray-100 cursor-pointer transition"
    >
      <div className="flex justify-between mb-2">
        <h3 className="text-2xl font-semibold">{notice.title}</h3>
        <span className="p-2 bg-blue-100 text-blue-800 rounded text-xs">
          {noticeTypes[notice.type] || notice.type}
        </span>
      </div>
      <div className="text-sm text-gray-500 italic">
        {getTimeAgo(notice.date_posted)}
      </div>
    </div>
  );
}
