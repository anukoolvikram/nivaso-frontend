import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingSpinner from '../../components/LoadingSpinner';

const SocietyDocuments = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const society_id = decoded?.id;

  const showToast = useToast();

  useEffect(() => {
    if (!society_id) return;

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/documents/get`, {
          params: { society_id }
        });
        setDocuments(res.data);
      } catch (err) {
        console.error(err);
        showToast('Failed to load documents', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [society_id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return alert('Please enter a title and select a file');

    try {
      setLoading(true);

      const cloudFormData = new FormData();
      cloudFormData.append('file', file);
      cloudFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/raw/upload`,
        cloudFormData
      );

      const cloudUrl = cloudinaryRes.data.secure_url;

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/documents/post`, {
        title,
        society_id,
        url: cloudUrl
      });

      setDocuments(prev => [res.data, ...prev]);
      setTitle('');
      setFile(null);
      setShowForm(false);
      showToast('Document uploaded successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Upload failed!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    const id = docToDelete.id;
    setDeletingId(id);

    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/documents/delete/${id}`);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      showToast('Document deleted successfully!', 'success');
      setShowDeleteDialog(false);
      setDocToDelete(null);
    } catch (error) {
      console.error(error);
      showToast('Delete failed!', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full mx-auto">
      {!showForm && (
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-400"
          >
            Upload New
          </button>
        </div>
      )}

      {showForm && (
        <>
          <button
            onClick={() => setShowForm(false)}
            className="mb-2 text-gray-700 hover:text-black flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>
          <form onSubmit={handleUpload} className="space-y-4 mb-6 border p-4 rounded shadow">
            <div>
              <label className="block font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="Eg: Maintenance Rules"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Choose PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="block bg-gray-200 p-1 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded font-medium transition ${
                loading ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500'
              } text-white`}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Upload'}
            </button>
          </form>
        </>
      )}

      {showDeleteDialog && docToDelete && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Document</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{docToDelete.title}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDocToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 flex items-center justify-center gap-2"
                onClick={confirmDelete}
                disabled={deletingId === docToDelete.id}
              >
                {deletingId === docToDelete.id ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          {documents.map(doc => (
            <div key={doc.id} className="p-4 border rounded shadow flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800">{doc.title}</h3>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  type="application/pdf"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Document
                </a>
              </div>
              <button
                onClick={() => {
                  setDocToDelete(doc);
                  setShowDeleteDialog(true);
                }}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocietyDocuments;
