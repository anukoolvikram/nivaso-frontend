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

const SocietyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [dismissComment, setDismissComment] = useState('');
  const [activeStatus, setActiveStatus] = useState('Received');

  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const societyCode = decoded?.society_code;
  const [showSaveButton, setShowSaveButton]=useState(false)

  const statusOptions = ['Received', 'Under Review', 'Taking Action', 'Dismissed/Resolved'];

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get('http://localhost:5000/complaints/get-complaints', {
          params: { society_code: societyCode },
        });

        const complaintsWithNames = await Promise.all(
          response.data.map(async (complaint) => {
            try {
              const res = await axios.get('http://localhost:5000/complaints/get-resident', {
                params: { id: complaint.resident_id },
              });
              return { 
                ...complaint, 
                resident_name: res.data.name || 'Unknown',
                resident_flat: res.data.flat_id || 'NA'
              };
            } catch (err) {
              console.error(`Error fetching resident ${complaint.resident_id}:`, err);
              return { ...complaint, resident_name: 'Unknown' };
            }
          })
        );
        setComplaints(complaintsWithNames);
      } catch (err) {
        setError('Failed to fetch complaints.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (societyCode) {
      fetchComplaints();
    }
  }, [societyCode]);

  const getFilteredComplaints = () => {
    if (activeStatus === 'Dismissed/Resolved') {
      return complaints.filter(c => c.status === 'Dismissed' || c.status === 'Resolved');
    }
    return complaints.filter(c => c.status === activeStatus);
  };

  const handleComplaintClick = async (complaint) => {
    if (complaint.status === "Received") {
      try {
        const updatedStatus = "Under Review";
  
        await axios.put("http://localhost:5000/complaints/change-status", {
          id: complaint.id,
          status: updatedStatus,
        });
  
        const updatedComplaint = {
          ...complaint,
          status: updatedStatus,
          comment: complaint.comment || '',
        };
  
        setComplaints(prev =>
          prev.map(c =>
            c.id === complaint.id ? updatedComplaint : c
          )
        );
  
        setSelectedComplaint(updatedComplaint);
        setNewStatus(updatedStatus);
        setDismissComment(updatedComplaint.comment);
      } catch (err) {
        console.error("Auto-update to Under Review failed:", err);
      }
    } 
    else {
      setSelectedComplaint(complaint);
      setNewStatus(complaint.status);
      setDismissComment(complaint.comment || '');
    }
  };
  

  const handleSaveStatus = async () => {
    if (newStatus === 'Dismissed' && dismissComment.trim() === '') {
      alert('Please enter a dismissal comment.');
      return;
    }

    try {
      await axios.put('http://localhost:5000/complaints/change-status', {
        id: selectedComplaint.id,
        status: newStatus,
        comment: newStatus === 'Dismissed' ? dismissComment : undefined,
      });

      setComplaints(prev =>
        prev.map(c =>
          c.id === selectedComplaint.id
            ? { ...c, status: newStatus, comment: newStatus === 'Dismissed' ? dismissComment : c.comment }
            : c
        )
      );

      setSelectedComplaint(prev => ({
        ...prev,
        status: newStatus,
        comment: newStatus === 'Dismissed' ? dismissComment : prev.comment,
      }));
    } catch (err) {
      console.error('Error saving status:', err);
    }
    setShowSaveButton(false)
  };

  const handleBack = () => {
    setSelectedComplaint(null);
    setNewStatus('');
    setDismissComment('');
  };

  if (loading) return <div className="text-center text-gray-600 mt-8">Loading complaints...</div>;
  if (error) return <div className="text-center text-red-500 mt-8">{error}</div>;
  if (complaints.length === 0) return <div className="text-center text-gray-500 mt-8">No complaints found.</div>;

  return (
    <div className="w-full mx-auto">

      {/* viewing a complaint */}
      {selectedComplaint ? (
        <div className="bg-white shadow-lg rounded p-6 border border-blue-300">
          <button
            onClick={() => setSelectedComplaint(null)}
            className="mb-2 text-gray-700 hover:text-black flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="text-2xl font-semibold">{selectedComplaint.title}</div>

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
          <div className="prose max-w-none mb-4">
            {selectedComplaint.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div className="flex justify-end pt-1 mb-4 text-sm border-t text-gray-600">Posted by: <span className='font-medium ml-2'>{selectedComplaint.resident_name} ({selectedComplaint.resident_flat})</span></div>

          <div className="mb-4">
            <label className="mb-2 text-gray-600 mr-2">Change Status:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="Under Review">Under Review</option>
              <option value="Taking Action">Taking Action</option>
              <option value="Dismissed">Dismissed</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {newStatus === 'Dismissed' && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Dismissal Comment</label>
              <textarea
                className="w-full px-3 py-2 border rounded border-gray-300"
                placeholder="Enter reason for dismissal"
                value={dismissComment}
                onChange={(e) => {
                  setDismissComment(e.target.value); 
                  setShowSaveButton(true)}}
              />
            </div>
          )}

          {(newStatus !== selectedComplaint.status || showSaveButton) && (
            <button
              onClick={handleSaveStatus}
              className="bg-teal-500 text-white px-4 py-2 hover:bg-teal-400 mb-4"
            >
              Update Status
            </button>
          )}

        </div>
      ) : (
        // status options
        <>
          <div className="mb-4 overflow-x-auto">
            <div className="flex space-x-3 border-b pb-2">
              {statusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-4 py-2 font-medium rounded-full whitespace-nowrap ${
                    activeStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'border hover:bg-gray-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* list of complaints */}
          <ul className="space-y-4 p-0">
            {getFilteredComplaints().map((complaint) => (
              <li
                key={complaint.id}
                className="bg-white shadow-md rounded p-4 border border-gray-200 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                onClick={() => handleComplaintClick(complaint)}
              >
                <div className='flex justify-between mb-2'>
                  <div className="text-2xl font-semibold text-gray-800">{complaint.title}</div>
                  {/* <span>Status: <span className="font-medium text-gray-800">{complaint.status}</span></span> */}
                </div>

                <div className="text-sm text-gray-500">
                  <div className="text-sm text-gray-500 italic">{getTimeAgo(complaint.created_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default SocietyComplaints;
