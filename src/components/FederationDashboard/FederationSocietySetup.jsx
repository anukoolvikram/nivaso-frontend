import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FederationSocietySetup = ({ federation_code: propFederationCode }) => {
  const [federationCode, setFederationCode] = useState(propFederationCode || localStorage.getItem('federation_code'));
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await axios.get('/auth/federation/getSociety', {
          params: { federationCode }
        });
        setSocieties(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching societies:', error);
        setSocieties([]);
      }
    };

    fetchSocieties();
  }, [federationCode]);

  const handleEditClick = (society) => {
    setSelectedSociety(society);
    setIsEditing(true);
    setIsConfirmed(false); // reset confirmation when modal opens
  };

  const handleChange = (e) => {
    setSelectedSociety((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        societyCode: selectedSociety.society_code,
        societyName: selectedSociety.society_name,
        societyType: selectedSociety.society_type,
      };

      const response = await axios.put('/auth/federation/updateSociety', payload);

      setSocieties((prev) =>
        prev.map((soc) =>
          soc.society_code === selectedSociety.society_code ? response.data : soc
        )
      );

      setIsEditing(false);
      setIsConfirmed(false);
    } catch (error) {
      console.error('Error saving society:', error);
    }
  };

  return (
    <div className="mx-auto mt-8">
      <div className="overflow-x-auto shadow rounded-lg bg-white">
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
              <tr key={society.id} className="hover:bg-gray-50 transition">
                <td className="p-3 border">{index + 1}</td>
                <td className="p-3 border">{society.society_code}</td>
                <td className="p-3 border">{society.society_name}</td>
                <td className="p-3 border">{society.society_type}</td>
                <td className="p-3 border">
                  <button
                    onClick={() => handleEditClick(society)}
                    className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditing && selectedSociety && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded border shadow-2xl p-8 w-full max-w-md animate-fadeIn">
            <h4 className="font-semibold mb-4 text-gray-800">EDIT SOCIETY</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Society Code</label>
                <input
                  type="text"
                  name="society_code"
                  value={selectedSociety?.society_code || ''}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Society Name</label>
                <input
                  type="text"
                  name="society_name"
                  value={selectedSociety?.society_name || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Society Type</label>
                <select
                  name="society_type"
                  value={selectedSociety?.society_type || ''}
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
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isConfirmed}
                className={`px-4 py-2 rounded-md transition ${
                  isConfirmed
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FederationSocietySetup;
