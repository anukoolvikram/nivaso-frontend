import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext';

const SocietyDocuments = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const society_id = decoded?.society_id;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);


  const showToast = useToast();

  // Fetch documents
  useEffect(() => {
    if (!society_id) return;

    axios
      .get('http://localhost:5000/documents', {
        params: { society_id }
      })
      .then(res => setDocuments(res.data))
      .catch(err => console.error(err));
  }, [society_id]);

  // Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return alert('Please enter a title and select a file');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    formData.append('society_id', society_id);

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/documents', formData);
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

  // Confirm & Delete handler
  const confirmDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this document?");
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:5000/documents/${id}`);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      showToast('Document deleted successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Delete failed!', 'error');
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
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-500"
            >
              {loading ? 'Uploading...' : 'Upload'}
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
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={async () => {
                try {
                await axios.delete(`http://localhost:5000/documents/${docToDelete.id}`);
                setDocuments(prev => prev.filter(doc => doc.id !== docToDelete.id));
                showToast('Document deleted successfully!', 'success');
                } catch (error) {
                console.error(error);
                showToast('Delete failed!', 'error');
                } finally {
                setShowDeleteDialog(false);
                setDocToDelete(null);
                }
            }}
            >
            Delete
            </button>
        </div>
        </div>
    </div>
    )}


      {!showForm && (
        <div>
          {documents.length === 0 ? (
            <p className="text-gray-500">No documents to show.</p>
          ) : (
            <ul className="space-y-2 p-0">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded border"
                >
                  <span>{doc.title}</span>
                  <div className="flex gap-4">
                    <a
                      href={`http://localhost:5000/uploads/${doc.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-gray-500 text-white hover:bg-gray-400 transition-colors text-sm rounded text-center"
                    >
                      View
                    </a>
                    <button
                      onClick={() => {
                        setDocToDelete(doc);
                        setShowDeleteDialog(true);
                      }}                      
                      className="px-3 py-1 bg-red-500 text-white hover:bg-red-400 transition-colors text-sm rounded"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SocietyDocuments;
