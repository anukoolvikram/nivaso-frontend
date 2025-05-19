// Add these imports
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

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
};

const noticeTypes = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'notice', label: '📄 Notice' },
  { value: 'lost_and_found', label: '🧩 Lost & Found' }
];

const ResidentNoticeboard = () => {
  const [notices, setNotices] = useState([]);
  const [userNotices, setUserNotices] = useState([]);
  const [viewingNotice, setViewingNotice] = useState(null);
  const [showingUserNotices, setShowingUserNotices] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', type: '' });
  const [formError, setFormError] = useState(null);

  const [userId, setUserId] = useState(null);
  const [societyCode, setSocietyCode] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUserId(decoded.id);
      setSocietyCode(decoded.society_code);
      fetchNotices(decoded.society_code);
      fetchUserNotices(decoded.id);
    }
  }, []);

  const fetchNotices = async (society_code) => {
    try {
      const res = await axios.get('http://localhost:5000/notices/all-notices', {
        params: { society_code }
      });

      const approvedNotices = Array.isArray(res.data)
        ? res.data.filter(notice => notice.approved === true)
        : [];

      const enrichedNotices = await Promise.all(
        approvedNotices.map(async (notice) => {
          if (notice.user_id) {
            try {
              const userRes = await axios.get(`http://localhost:5000/user-name/${notice.user_id}`);
              const { author_name, flat_id } = userRes.data;
              return { ...notice, author_name, flat_id };
            } catch {
              return { ...notice, author_name: 'Unknown', flat_id: 'N/A' };
            }
          } else {
            return { ...notice, author_name: 'System', flat_id: '—' };
          }
        })
      );

      setNotices(enrichedNotices);
    } catch (err) {
      console.error('Error fetching notices:', err);
      showToast("Unable to load notices. Please refresh.", "error");
    }    
  };

  const fetchUserNotices = async (user_id) => {
    try {
      const res = await axios.get('http://localhost:5000/notices/user-notices', {
        params: { user_id }
      });

      const enrichedUserNotices = await Promise.all(
        res.data.map(async (notice) => {
          try {
            const userRes = await axios.get(`http://localhost:5000/user-name/${notice.user_id}`);
            const { author_name, flat_id } = userRes.data;
            return { ...notice, author_name, flat_id };
          } catch {
            return { ...notice, author_name: 'Unknown', flat_id: 'N/A' };
          }
        })
      );

      setUserNotices(enrichedUserNotices);
    } catch (err) {
      console.error('Error fetching user notices:', err);
      showToast("Unable to fetch your notices. Please try again later.", "error");
    }        
  };

  const handleView = (notice) => {
    setViewingNotice(notice);
    setIsWriting(false);
  };

  const handleBack = () => {
    setViewingNotice(null);
    setIsWriting(false);
    setFormError(null);
    setShowingUserNotices(false);
  };

  const handleWrite = () => {
    setFormData({ title: '', description: '', type: '' });
    setFormError(null);
    setIsWriting(true);
    setViewingNotice(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.description.trim() || !formData.type) {
      showToast("Please fill all fields before submitting.", "error");
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/notices/post-user-notice', {
        ...formData,
        user_id: userId,
        society_code: societyCode
      });

      if (res.status === 201) {
        showToast("Notice submitted successfully! It will be visible once approved.", "success");
        setIsWriting(false);
        fetchNotices(societyCode);
        fetchUserNotices(userId);
      } else {
        showToast("Failed to post notice. Try again.", "error");
      }
    } catch (err) {
      console.error('Error posting notice:', err);
      showToast("Server error. Please try again later.", "error");
    }
  };


  const displayedNotices = showingUserNotices ? userNotices : notices;

  return (
    <div className="w-full mx-auto">
      <div className="flex justify-start gap-3 mb-4 items-center">
        {(viewingNotice || isWriting) && (
          <button onClick={handleBack} className="text-gray-700 hover:text-black transition">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        )}

        {!viewingNotice && !isWriting && (
          <>
            {!showingUserNotices && (
              <button
                onClick={handleWrite}
                className="inline-flex items-center bg-blue-500 hover:bg-blue-400 text-white font-medium px-4 py-2 rounded-md shadow-sm transition"
              >
                Write Notice
              </button>
            )}

            {!showingUserNotices ? (
              <button
                onClick={() => setShowingUserNotices(true)}
                className="px-4 py-2 font-medium border hover:bg-gray-100"
              >
                My Notices
              </button>
            ) : (
              <button onClick={handleBack} className="text-gray-700 hover:text-black transition">
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Write Form */}
      {isWriting && (
        <form onSubmit={handleFormSubmit} className="bg-white border border-gray-200 p-6 rounded-xl space-y-6">
          {formError && <div className="text-red-600 text-sm font-medium">{formError}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700">Notice Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Enter title"
              className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Write the full notice here"
              className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 h-32 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Select Type</option>
              {noticeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-5 py-2 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-md transition"
            >
              Submit
            </button>
          </div>
        </form>
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

          <p className="text-sm text-gray-500 mb-4">
            Posted on {new Date(viewingNotice.date_posted).toLocaleString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </p>


          <div className="prose max-w-none text-gray-800 leading-relaxed mb-6">
            {viewingNotice.description}
          </div>

          {viewingNotice.user_id && (
            <div className="text-right text-sm text-gray-500 mt-4">
              Posted by:
              <span className="ml-1 font-medium uppercase">
                {viewingNotice.author_name} ({viewingNotice.flat_id})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Notices List */}
      {!viewingNotice && !isWriting && (
        <div className="space-y-4">
          {displayedNotices.length === 0 ? (
            <p className="text-gray-600">No notices available.</p>
          ) : (
            displayedNotices.map((notice) => (
              <div
                key={notice.notice_id}
                onClick={() => handleView(notice)}
                className="border border-gray-200 p-4 rounded shadow hover:shadow-md hover:bg-gray-100 transition cursor-pointer"
              >
                <div className="flex justify-between">
                  <div className="text-2xl font-semibold text-gray-800">{notice.title}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="p-2 bg-blue-100 text-blue-800 rounded text-xs">
                      {noticeTypes.find((t) => t.value === notice.type)?.label || notice.type}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 italic mt-1">{getTimeAgo(notice.date_posted)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ResidentNoticeboard;
