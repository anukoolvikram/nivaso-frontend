import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingSpinner from '../LoadingSpinner.jsx'

const FederationSocietySetup = ({ federation_code: propFederationCode }) => {
  const [federationCode, setFederationCode] = useState(
    propFederationCode || localStorage.getItem('federation_code')
  );
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSocieties, setLoadingSocieties] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSocieties = async () => {
      setLoadingSocieties(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/federation/getSociety`,
          {
            params: { federationCode },
          }
        );
        setSocieties(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching societies:', error);
        setSocieties([]);
      } finally {
        setLoadingSocieties(false);
      }
    };

    fetchSocieties();
  }, [federationCode]);

  const handleEditClick = (society) => {
    setSelectedSociety(society);
    setIsEditing(true);
    setIsConfirmed(false);
  };

  const handleAddClick = () => {
    setSelectedSociety({ society_name: '', society_type: 'Apartment' });
    setIsEditing(true);
    setIsConfirmed(false);
  };

  const handleChange = (e) => {
    setSelectedSociety((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!selectedSociety.society_name || !selectedSociety.society_type) return;

      if (selectedSociety.society_code) {
        const payload = {
          societyCode: selectedSociety.society_code,
          societyName: selectedSociety.society_name,
          societyType: selectedSociety.society_type,
        };

        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/federation/updateSociety`,
          payload
        );

        setSocieties((prev) =>
          prev.map((soc) =>
            soc.society_code === selectedSociety.society_code ? response.data : soc
          )
        );
      } else {
        const payload = {
          federationCode,
          societyName: selectedSociety.society_name,
          societyType: selectedSociety.society_type,
        };

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/federation/addSociety`,
          payload
        );

        setSocieties((prev) => [...prev, response.data]);
      }

      setIsEditing(false);
      setIsConfirmed(false);
    } catch (error) {
      console.error('Error saving society:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-8">
      <div className="flex justify-end mt-4">
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium px-4 py-2 mb-2 shadow-sm"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : '+ Add Society'}
        </button>
      </div>

      <div className="min-h-[200px] flex items-center justify-center">
        {loadingSocieties ? (
          <LoadingSpinner/>
        ) : (
          <div className="overflow-x-auto shadow rounded-lg bg-white w-full">
            <table className="w-full table-auto border-collapse rounded-xl shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-left text-sm text-gray-700">
                  <th className="p-3 border">S. No.</th>
                  <th className="p-3 border">Society Code</th>
                  <th className="p-3 border">Society Name</th>
                  <th className="p-3 border">Society Type</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-800">
                {societies.map((society, index) => (
                  <tr key={society.id || society.society_code} className="hover:bg-gray-50 transition">
                    <td className="p-3 border">{index + 1}</td>
                    <td className="p-3 border">{society.society_code}</td>
                    <td className="p-3 border">{society.society_name}</td>
                    <td className="p-3 border">{society.society_type}</td>
                    <td className="p-3 border">
                      <button
                        onClick={() => handleEditClick(society)}
                        className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2"
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={16} color="inherit" /> : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isEditing && selectedSociety && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded border shadow-2xl p-8 w-full max-w-md animate-fadeIn">
            <h4 className="font-semibold mb-4 text-gray-800">
              {selectedSociety.society_code ? 'EDIT SOCIETY' : 'ADD SOCIETY'}
            </h4>

            <div className="space-y-4">
              {selectedSociety.society_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Society Code</label>
                  <input
                    type="text"
                    name="society_code"
                    value={selectedSociety.society_code}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Society Name</label>
                <input
                  type="text"
                  name="society_name"
                  value={selectedSociety.society_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Society Type</label>
                <select
                  name="society_type"
                  value={selectedSociety.society_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Tenement">Tenement</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="confirm-edit"
                  checked={isConfirmed}
                  onChange={() => setIsConfirmed(!isConfirmed)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="confirm-edit" className="text-sm text-gray-700">
                  I confirm that the above details are correct
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setIsConfirmed(false);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isConfirmed || loading}
                className={`px-4 py-2 rounded-md transition flex items-center justify-center ${
                  isConfirmed
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FederationSocietySetup;
