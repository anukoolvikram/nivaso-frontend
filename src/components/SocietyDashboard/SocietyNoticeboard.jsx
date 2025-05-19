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
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
};

const SocietyNoticeboard = () => {
  const [notices, setNotices] = useState([]);
  const [pendingNotices, setPendingNotices] = useState([]);
  const [viewingNotice, setViewingNotice] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showingPending, setShowingPending] = useState(false);
  const [federationNotices, setFederationNotices] = useState([]);
  const [showingFederation, setShowingFederation] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'announcement',
    society_id: '',
    approved: true
  });
  const showToast = useToast();
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  const noticeTypes = [
    { value: 'announcement', label: '📢 Announcement' },
    { value: 'notice', label: '📄 Notice' },
    { value: 'poll', label: '📊 Poll' },
    { value: 'lost_and_found', label: '🧩 Lost & Found' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      // console.log(decoded)
      setFormData((prev) => ({ ...prev, society_id: decoded.society_id }));
      fetchNotices(decoded.society_id);
      fetchPendingNotices(decoded.society_id);
      fetchFederationNotices(decoded);
    }
  }, []);

  const fetchFederationNotices = async (decoded) => {
    try {
      const fedRes = await axios.get(`http://localhost:5000/notices/federation-id/${decoded.society_id}`);
      const federation_id = fedRes.data.federation_id;

      const res = await axios.get(`http://localhost:5000/notices/federation-notice/get/${federation_id}`);
      setFederationNotices(res.data);
      // console.log(res.data)
    } catch (err) {
      console.error("Error fetching federation notices:", err);
      showToast('Failed to load federation notices', 'error');
    }
  };
  

  const fetchNotices = async (society_id) => {
    try {
      const res = await axios.get('http://localhost:5000/notices/all-notices', {
        params: { society_id }
      });
  
      const approvedNotices = Array.isArray(res.data)
        ? res.data.filter((notice) => notice.approved === true)
        : [];
  
      const enrichedNotices = await Promise.all(
        approvedNotices.map(async (notice) => {
          if (notice.user_id) {
            try {
              const userRes = await axios.get(`http://localhost:5000/user-name/${notice.user_id}`);
              const { author_name, flat_id } = userRes.data;
  
              return {
                ...notice,
                author_name: author_name || 'Unknown',
                flat_id: flat_id || 'N/A'
              };
            } catch (error) {
              console.warn(`Failed to fetch user for notice ${notice.id}:`, error);
              return {
                ...notice,
                author_name: 'Unknown',
                flat_id: 'N/A'
              };
            }
          } else {
            return {
              ...notice,
              author_name: null,
              flat_id: null
            };
          }
        })
        
      );

      // console.log(enrichedNotices)
  
      setNotices(enrichedNotices);
    } catch (err) {
      console.error('Error fetching notices:', err);
      showToast("Failed to load approved notices", "error");
    }
    
  };
  

  const fetchPendingNotices = async (society_id) => {
    try {
      const res = await axios.get('http://localhost:5000/notices/all-notices', {
        params: { society_id }
      });
  
      const unapproved = Array.isArray(res.data)
        ? res.data.filter((notice) => notice.approved === false)
        : [];
  
      const noticesWithAuthorInfo = await Promise.all(
        unapproved.map(async (notice) => {
          if (notice.user_id) {
            try {
              const userRes = await axios.get(`http://localhost:5000/notices/user-name/${notice.user_id}`);
              const { author_name, flat_id } = userRes.data;
  
              return {
                ...notice,
                author_name: author_name || 'Unknown',
                flat_id: flat_id || 'N/A'
              };

            } catch (err) {
              console.warn(`Error fetching user info for notice ID ${notice.id}:`, err);
              return {
                ...notice,
                author_name: 'Unknown',
                flat_id: 'N/A'
              };
            }
          } else {
            return {
              ...notice,
              author_name: 'System',
              flat_id: '—'
            };
          }
        })
      );
      
      // console.log(noticesWithAuthorInfo)
      setPendingNotices(noticesWithAuthorInfo);
    } catch (err) {
      console.error('Error fetching pending notices:', err);
      showToast("Failed to load pending notices", "error");
    }
    
  };
  

  const handleApprove = async (notice_id) => {
    try {
      await axios.put(`http://localhost:5000/notices/approve-notice/${notice_id}`);
      showToast("Notice approved!");
      fetchNotices(formData.society_id);
      fetchPendingNotices(formData.society_id);
    } catch (err) {
      console.error("Error approving notice:", err);
      const message =
        err?.response?.data?.message || err?.response?.data?.error || "Approval failed. Please try again.";
      showToast(message, "error");
    }
  };
  

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/notices/edit-notice/${formData.notice_id}`, formData);
        showToast('Notice updated!');
      } else {
        await axios.post('http://localhost:5000/notices/post-notice', formData);
        showToast('Notice posted!');
      }
  
      setShowForm(false);
      setEditing(false);
      setViewingNotice(null);
      setFormData((prev) => ({ ...prev, title: '', description: '' }));
      fetchNotices(formData.society_id);
      fetchPendingNotices(formData.society_id);
    } 
    catch (err) {
      console.error('Error submitting notice:', err);
      const message =
        err?.response?.data?.message || err?.response?.data?.error || 'Failed to submit notice. Please try again.';
      showToast(message, 'error');
    }
  };
  

  const handleEdit = (notice) => {
    setViewingNotice(null); // hide viewing area
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
    setEditing(false);
    setShowForm(false);
    setShowingPending(false);
    setConfirmUpdate(false);
    setShowingFederation(false);
  };
  
  const displayedNotices = showingPending
  ? pendingNotices
  : showingFederation
  ? federationNotices
  : notices;


  return (
    <div className="w-full mx-auto">
      <div className="flex justify-start gap-3 mb-4 items-center">
        {(viewingNotice || showForm || showingPending || showingFederation) && (
          <button onClick={handleBack} className="text-gray-700 hover:text-black transition">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        )}

          {!showingPending && !showForm && !viewingNotice && !showingFederation ?
            <button
              onClick={() => setShowingPending(!showingPending)}
              className="inline-flex items-center gap-2 border hover:bg-gray-100 text-gray-800 font-medium px-4 py-2 shadow-sm transition"
            >
              Pending Notices
            </button>
            :
           <></>
          }


        {!viewingNotice && !showForm && !showingPending && !showingFederation && (
          <button
            onClick={() => setShowingFederation(true)}
            className="bg-gray-500 text-white inline-flex items-center gap-2 border hover:bg-gray-400 font-medium px-4 py-2 shadow-sm transition"
          >
            Federation Notices
          </button>
        )}

        {!viewingNotice && !showForm && !showingPending && !showingFederation && (
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

      {/* WRITE NOTICE */}
      {showForm && (
        <form onSubmit={handleSubmit} className="w-full bg-white border border-gray-200 shadow-md p-6 rounded-xl mb-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Notice Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a short title"
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
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
              placeholder="Write the full notice content here..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 resize-none text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                onChange={() => setConfirmUpdate(prev => !prev)}
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
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-5 py-2 rounded-md transition"
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

      {/* VIEW NOTICE */}
      {viewingNotice && !showForm ? (
        <div className="bg-white border border-gray-200 p-4 rounded shadow-md">
          <div className='flex justify-between mb-2'>
            <div className="text-2xl font-semibold text-gray-800">{viewingNotice.title}</div>
            <div className="flex flex-wrap gap-2">
              <span className="p-2 bg-blue-100 text-blue-800 rounded text-xs">
                {noticeTypes.find((t) => t.value === viewingNotice.type)?.label || viewingNotice.type}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-4">
            Posted on {new Date(viewingNotice.date_posted).toLocaleString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>

          <div className="prose max-w-none text-gray-800 leading-relaxed mb-6">{viewingNotice.description}</div>

          <div className="space-y-2 mb-6"> 
            {viewingNotice.user_id && (
              <div className="flex justify-end mt-6 mb-4 pt-1 text-sm text-gray-500">
                Posted by:<span className='ml-1 font-medium uppercase'>{viewingNotice.author_name} ({viewingNotice.flat_id})</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleEdit(viewingNotice)}
              className="bg-teal-500 hover:bg-teal-400 text-white font-medium p-2 px-3 rounded-md shadow-sm transition"
            >
              Edit Notice
            </button>

            {showingPending && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(notice.notice_id);
                }}
                className="text-sm bg-teal-500 text-white p-2 px-3 font-medium hover:bg-teal-400 transition"
              >
                Approve
              </button>
              )}
          </div>
        </div>
      ):
      <></>
      }

        {/* LIST OF NOTICES */}
        {!viewingNotice && !showForm && !editing && (
        <div className="space-y-4 -mt-2">
          {displayedNotices.map((notice) => (
            <div key={notice.id} onClick={() => handleView(notice)}
              className="border border-gray-200 p-4 rounded shadow hover:shadow-md hover:bg-gray-100 transition cursor-pointer"
            >
              <div className='flex justify-between mb-2'>
                <div className="text-2xl font-semibold text-gray-800">{notice.title}</div>
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

export default SocietyNoticeboard;
