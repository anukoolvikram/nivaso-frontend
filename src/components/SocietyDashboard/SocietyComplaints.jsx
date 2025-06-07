import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../LoadingSpinner';
import CircularProgress from '@mui/material/CircularProgress';

const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);

  const minutes = Math.floor((now - past) / (1000 * 60));
  const hours = Math.floor((now - past) / (1000 * 60 * 60));
  const days = Math.floor((now - past) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor((now - past) / (1000 * 60 * 60 * 24 * 7));

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
  const [saveError, setSaveError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [dismissComment, setDismissComment] = useState('');
  const [activeStatus, setActiveStatus] = useState('Received');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);   
  const [uploadingProof, setUploadingProof] = useState(false); 

  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const societyCode = decoded?.society_code;

  const isReadOnly = !!selectedComplaint && 
    ['Resolved', 'Dismissed'].includes(selectedComplaint.status);


  const statusOptions = [
    'Received',
    'Under Review',
    'Taking Action',
    'Dismissed',
    'Resolved',
  ];

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/complaints/get-complaints`,
          { params: { society_code: societyCode } }
        );

        const complaintsWithNames = await Promise.all(
          response.data.map(async (complaint) => {
            try {
              const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/complaints/get-resident`,
                { params: { id: complaint.resident_id } }
              );
              return {
                ...complaint,
                resident_name: res.data.name || 'Unknown',
                resident_flat: res.data.flat_id || 'NA',
              };
            } catch (err) {
              console.error(
                `Error fetching resident ${complaint.resident_id}:`,
                err
              );
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
    return complaints.filter((c) => c.status === activeStatus);
  };


  // HELPER FUNCTIONS
  // upload selectedImages to Cloudinary, return array of secure URLs
const uploadImagesToCloudinary = async () => {
  if (!selectedImages.length) return [];
  const promises = selectedImages.map(file => {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);         
    return axios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, 
      form
    ).then(r => r.data.secure_url);
  });
  return Promise.all(promises);
};

  const handleComplaintClick = async (complaint) => {
    // Auto-update Received -> Under Review
    if (complaint.status === 'Received') {
      try {
        const updatedStatus = 'Under Review';

        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/complaints/change-status`,
          {
            id: complaint.id,
            status: updatedStatus,
          }
        );

        const updatedComplaint = {
          ...complaint,
          status: updatedStatus,
          comment: complaint.comment || '',
        };

        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaint.id ? updatedComplaint : c
          )
        );

        setSelectedComplaint(updatedComplaint);
        setNewStatus(updatedStatus);
        setDismissComment(updatedComplaint.comment);
      } catch (err) {
        console.error('Auto-update to Under Review failed:', err);
      }
    } else {
      setSelectedComplaint(complaint);
      setNewStatus(complaint.status);
      setDismissComment(complaint.comment || '');
    }
    setSaveError(null);
  };

  const handleSaveStatus = async () => {
    // Show error inside component instead of alert
    if (newStatus === 'Resolved' && selectedImages.length === 0) {
      setSaveError('Please attach at least one proof image.');
      return;
    }

    if (newStatus === 'Dismissed' && dismissComment.trim() === '') {
      setSaveError('Please enter a dismissal comment.');
      return;
    }

    setSaveError(null);
    setUpdatingStatus(true);

    let imageUrls = [];
    if (newStatus === 'Resolved') {
      setUploadingProof(true);
      imageUrls = await uploadImagesToCloudinary();
      setUploadingProof(false);
    }


    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/complaints/change-status`,
        {
          id: selectedComplaint.id,
          status: newStatus,
          comment: newStatus === 'Dismissed' ? dismissComment : undefined,
          images: imageUrls 
        }
      );

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === selectedComplaint.id
            ? {
                ...c,
                status: newStatus,
                comment:
                  newStatus === 'Dismissed'
                    ? dismissComment
                    : c.comment,
              }
            : c
        )
      );

      setSelectedComplaint((prev) => ({
        ...prev,
        status: newStatus,
        comment:
          newStatus === 'Dismissed' ? dismissComment : prev.comment,
      }));
    } catch (err) {
      console.error('Error saving status:', err);
      setSaveError('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
      setShowSaveButton(false);
    }
  };

  const handleBack = () => {
    setSelectedComplaint(null);
    setNewStatus('');
    setDismissComment('');
    setSaveError(null);
    setSelectedImages([]);   
  };

  if (loading) return <LoadingSpinner />;

  if (error)
    return (
      <div className="text-center text-red-500 mt-8">{error}</div>
    );
  if (complaints.length === 0)
    return (
      <div className="text-center text-gray-500 mt-8">
        No complaints found.
      </div>
    );

  return (
    <div className="w-full mx-auto">
      {selectedComplaint ? (
        <div className="bg-white shadow-lg rounded p-6 border border-blue-300">
          <button
            onClick={handleBack}
            className="mb-2 text-gray-700 hover:text-black flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="text-2xl font-semibold">
            {selectedComplaint.title}
          </div>

          <div className="text-sm text-gray-500 mb-4 mt-2">
            Posted on{' '}
            {new Date(
              selectedComplaint.created_at
            ).toLocaleString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </div>

          <div className="prose max-w-none mb-4">
            {selectedComplaint.content.split('\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {selectedComplaint.images?.length > 0 && (
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {selectedComplaint.images.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`proof-${idx}`}
                className="rounded shadow-sm object-cover w-full h-48"
              />
            ))}
          </div>
        )}


          <div className="flex justify-end pt-1 mb-4 text-sm border-t text-gray-600">
            Posted by:{' '}
            <span className="font-medium ml-2">
              {selectedComplaint.resident_name} (
              {selectedComplaint.resident_flat})
            </span>
          </div>

          { !isReadOnly && (
            <>
              <div className="mb-4">
                <label className="mb-2 text-gray-600 mr-2">Change Status:</label>
                <select
                  value={newStatus}
                  onChange={e => {
                    setNewStatus(e.target.value);
                    setShowSaveButton(true);
                    setSaveError(null);
                  }}
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
                  {/* dismissal comment */}
                </div>
              )}

              {newStatus === 'Resolved' && (
                <div className="mb-4">
                  {/* proof file input */}
                </div>
              )}

              {saveError && (
                <div className="mb-4 text-red-500 font-medium">{saveError}</div>
              )}

              <button
                onClick={handleSaveStatus}
                disabled={updatingStatus || uploadingProof}
                className="bg-teal-500 text-white px-4 py-2 hover:bg-teal-400 mb-4 flex items-center justify-center gap-2"
              >
                {updatingStatus ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Update Status'
                )}
              </button>
            </>
          )}

          {newStatus === 'Dismissed' && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Dismissal Comment
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded border-gray-300"
                placeholder="Enter reason for dismissal"
                value={dismissComment}
                onChange={(e) => {
                  setDismissComment(e.target.value);
                  setShowSaveButton(true);
                  setSaveError(null);
                }}
              />
            </div>
          )}

          {newStatus === 'Resolved' && (!isReadOnly) && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Attach Proof Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => setSelectedImages(Array.from(e.target.files))}
                className="w-full border rounded px-2 py-1"
              />
              {selectedImages.length > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  {selectedImages.length} file{selectedImages.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
            )}

            { isReadOnly && (
              <div className="p-4 bg-gray-100 text-gray-600 rounded mb-4">
                This complaint is <strong>{selectedComplaint.status}</strong>—no further changes allowed.
              </div>
            )}



          {/* Display any saveError here */}
          {saveError && (
            <div className="mb-4 text-red-500 font-medium">
              {saveError}
            </div>
          )}

          {(newStatus !== selectedComplaint.status ||
            showSaveButton) && (
            <button
              onClick={handleSaveStatus}
              disabled={updatingStatus || uploadingProof}
              className="bg-teal-500 text-white px-4 py-2 hover:bg-teal-400 mb-4 flex items-center justify-center gap-2"
            >
              {updatingStatus ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Update Status'
              )}
            </button>
          )}
        </div>
      ) : (
        // List of complaints by status
        <>
          <div className="mb-4 overflow-x-auto">
            <div className="flex space-x-3 border-b pb-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveStatus(status);
                    setSaveError(null);
                  }}
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

          <ul className="space-y-4 p-0">
            {getFilteredComplaints().map((complaint) => (
              <li
                key={complaint.id}
                className="bg-white shadow-md rounded p-4 border border-gray-200 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                onClick={() => handleComplaintClick(complaint)}
              >
                <div className="flex justify-between mb-2">
                  <div className="text-2xl font-semibold text-gray-800">
                    {complaint.title}
                  </div>
                </div>

                <div className="text-sm text-gray-500 italic">
                  {getTimeAgo(complaint.created_at)}
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
