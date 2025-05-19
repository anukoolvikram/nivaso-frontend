// Updated ResidentComplaints.js with improved UI consistent with ResidentCommunity and Noticeboard

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

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

const ResidentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Other',
    content: '',
    is_anonymous: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const societyCode = decoded?.society_code;

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/complaints/get-complaints/${decoded.id}`, {
        params: { society_code: societyCode },
      });
      setComplaints(response.data);
    } catch (err) {
      setError('Failed to fetch complaints.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (societyCode) {
      fetchComplaints();
    }
  }, [societyCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/complaints/post-complaints', {
        ...formData,
        resident_id: decoded.id,
        society_code: societyCode,
      });
      setShowForm(false);
      setFormData({ title: '', type: 'Other', content: '', is_anonymous: false });
      fetchComplaints();
    } catch (err) {
      console.error('Error submitting complaint:', err);
      alert('Failed to post complaint');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (loading) return <div className="text-center text-gray-600 mt-8">Loading complaints...</div>;
  if (error) return <div className="text-center text-red-500 mt-8">{error}</div>;

  return (
    <div className="w-full">
      {!showForm && !selectedComplaint && (
        <button
          className="px-4 py-2 mb-4 font-medium bg-blue-500 text-white hover:bg-blue-400 transition"
          onClick={() => {
            setSelectedComplaint(null);
            setShowForm(true);
          }}
        >
          Write a Complaint
        </button>
      )}

      {/* writing a complaint */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded shadow-md space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Civil Works">Civil Works</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>

          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="is_anonymous"
              checked={formData.is_anonymous}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <span>Submit anonymously</span>
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded"
            >
              Submit
            </button>
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* viewing a complaint */}
      {selectedComplaint ? (
        <div className="bg-white shadow-md border border-blue-300 rounded p-6">
          <button
            onClick={() => setSelectedComplaint(null)}
            className="mb-2 text-gray-700 hover:text-black flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          
          <div className='flex justify-between'>
            <div className="text-2xl font-semibold">{selectedComplaint.title}</div>
            <span>Status: <span className="font-medium text-gray-800">{selectedComplaint.status}</span></span>
          </div>
         
          <div className="text-sm text-gray-500 mb-4 mt-2">
            Posted on {new Date(selectedComplaint.created_at).toLocaleString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>

          <div className="prose max-w-none">
            {selectedComplaint.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>

        </div>
      ) : (
        // list of complaints
        
        <ul className="space-y-4 p-0">
          {complaints.map((complaint) => (
            <li
              key={complaint.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:border-blue-400 cursor-pointer transition"
              onClick={() => setSelectedComplaint(complaint)}
            >
              <div className="flex justify-between mb-2">
                <div className="text-2xl font-semibold mb-2">{complaint.title}</div>
                <span>Status: <span className="font-medium text-gray-800">{complaint.status}</span></span>
              </div>
              <div className="text-sm text-gray-500 italic">{getTimeAgo(complaint.created_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResidentComplaints;
