import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from '../LoadingSpinner.jsx';
import CircularProgress from '@mui/material/CircularProgress';
import axios from "axios";

const SocietyFlatSetup = ({ society_code: propSocietyCode }) => {
  const [societyCode, setSocietyCode] = useState(propSocietyCode || localStorage.getItem("society_code"));
  const [flats, setFlats] = useState([]);
  const [currentFlat, setCurrentFlat] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [ownerEntered, setOwnerEntered] = useState(false);
  const [residentEntered, setResidentEntered] = useState(false);
  const [isNewFlat, setIsNewFlat] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoadingFlats, setIsLoadingFlats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingFlat, setViewingFlat] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // New states for delete-dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (viewingFlat) {
      fetchDocuments(viewingFlat.id);
    }
  }, [viewingFlat]);

  useEffect(() => {
    if (societyCode) fetchFlats();
  }, [societyCode]);

  const fetchFlats = async () => {
    setIsLoadingFlats(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/society/getFlatsData/${societyCode}`
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const sortedFlats = data.sort((a, b) => {
        const [blockA, numA] = [a.flat_id[0], parseInt(a.flat_id.slice(1), 10)];
        const [blockB, numB] = [b.flat_id[0], parseInt(b.flat_id.slice(1), 10)];
        return blockA === blockB ? numA - numB : blockA.localeCompare(blockB);
      });
      setFlats(sortedFlats);
      return sortedFlats;
    } catch (error) {
      console.error("Error fetching flats:", error);
      return [];
    } finally {
      setIsLoadingFlats(false);
    }
  };

  const handleEdit = (flat) => {
    setCurrentFlat(flat);
    setEditedData({
      ...flat,
      owner: flat.owner || { name: '', email: '', phone: '', address: '', initial_password: null },
      resident: flat.resident || { name: '', email: '', phone: '', address: '' }
    });
    setIsNewFlat(false);
    setShowModal(true);
    setValidationErrors({});
    setOwnerEntered(false);
    setResidentEntered(false);
    setIsConfirmed(false);
  };

  const handleAddNew = () => {
    setCurrentFlat({
      id: null,
      flat_id: '',
      occupancy: '',
      owner_id: null,
      resident_id: null,
      owner: { name: '', email: '', phone: '', address: '', initial_password: null },
      resident: { name: '', email: '', phone: '', address: '' }
    });
    setEditedData({
      flat_id: '',
      occupancy: '',
      owner: { name: '', email: '', phone: '', address: '', initial_password: null },
      resident: { name: '', email: '', phone: '', address: '' }
    });
    setIsNewFlat(true);
    setShowModal(true);
    setValidationErrors({});
    setOwnerEntered(false);
    setResidentEntered(false);
    setIsConfirmed(false);
  };

  const saveAllData = async () => {
    if (!validateDetails()) return;
    setSaving(true);
    try {
      const { id, flat_id, occupancy, owner, resident } = editedData;
      const endpoint = isNewFlat
        ? `${import.meta.env.VITE_BACKEND_URL}/society/createFlat`
        : `${import.meta.env.VITE_BACKEND_URL}/society/saveFlatsData`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isNewFlat ? undefined : id,
          society_code: societyCode,
          flat_id,
          occupancy,
          owner_id: isNewFlat ? null : currentFlat.owner_id,
          resident_id: isNewFlat ? null : currentFlat.resident_id,
          owner_name: owner.name,
          owner_email: owner.email,
          owner_phone: owner.phone,
          owner_address: owner.address,
          // Note: don't send initial_password if it's read-only/display-only
          resident_name: resident.name,
          resident_email: resident.email,
          resident_phone: resident.phone,
          resident_address: resident.address
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setServerError(data?.error || "An error occurred while saving.");
        return;
      }
      setShowModal(false);
      setIsNewFlat(false);
      setServerError("");

      // Refetch flats and show the edited flat again
      const updatedFlats = await fetchFlats();
      const updatedFlat = updatedFlats.find(f => f.id === currentFlat.id);
      if (updatedFlat) {
        setViewingFlat(updatedFlat);
      }
    } catch (error) {
      console.error("Error saving flat data:", error);
      setServerError("Server error. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  const validateDetails = () => {
    const errors = {};
    let isValid = true;
    if (!editedData.flat_id?.trim()) {
      errors.flat_id = "Flat ID is required";
      isValid = false;
    }
    if (!editedData.occupancy?.trim()) {
      errors.occupancy = "Occupancy is required";
      isValid = false;
    }
    if (
      ownerEntered ||
      (editedData.owner && (editedData.owner.name || editedData.owner.email || editedData.owner.phone))
    ) {
      if (!editedData.owner?.name?.trim()) {
        errors.ownerName = "Owner name is required";
        isValid = false;
      }
      if (!editedData.owner?.email?.trim()) {
        errors.ownerEmail = "Owner email is required";
        isValid = false;
      } else if (!/^\S+@\S+\.\S+$/.test(editedData.owner.email)) {
        errors.ownerEmail = "Invalid email format";
        isValid = false;
      }
      if (!editedData.owner?.phone?.trim()) {
        errors.ownerPhone = "Owner phone is required";
        isValid = false;
      }
    }
    if (
      editedData.occupancy === "Rented" &&
      (residentEntered || (editedData.resident && (editedData.resident.name || editedData.resident.email || editedData.resident.phone)))
    ) {
      if (!editedData.resident?.name?.trim()) {
        errors.residentName = "Resident name is required";
        isValid = false;
      }
      if (!editedData.resident?.email?.trim()) {
        errors.residentEmail = "Resident email is required";
        isValid = false;
      } else if (!/^\S+@\S+\.\S+$/.test(editedData.resident.email)) {
        errors.residentEmail = "Invalid email format";
        isValid = false;
      }
      if (!editedData.resident?.phone?.trim()) {
        errors.residentPhone = "Resident phone is required";
        isValid = false;
      }
    }
    setValidationErrors(errors);
    return isValid;
  };

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleOwnerChange = (field, value) => {
    setOwnerEntered(true);
    setEditedData(prev => ({
      ...prev,
      owner: { ...prev.owner, [field]: value }
    }));
  };

  const handleResidentChange = (field, value) => {
    setResidentEntered(true);
    setEditedData(prev => ({
      ...prev,
      resident: { ...prev.resident, [field]: value }
    }));
  };

  const fetchDocuments = async (flat_id) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/society/flatDocuments/get/${flat_id}`
      );
      setDocuments(res.data);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/raw/upload`,
        formData
      );
      const cloudUrl = cloudinaryRes.data.secure_url;

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/society/flatDocuments/post`, {
        title: uploadTitle,
        society_id: societyCode,
        flat_id: viewingFlat.id,
        url: cloudUrl
      });

      await fetchDocuments(viewingFlat.id);

      setUploadTitle('');
      setUploadFile(null);
      setShowUploadForm(false);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDoc = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/society/flatDocuments/delete/${docToDelete}`
      );
      await fetchDocuments(viewingFlat.id);
    } catch (err) {
      console.error("Failed to delete document", err);
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
      setDocToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-xl">
      {!viewingFlat ? (
        <>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleAddNew}
              className="bg-teal-500 hover:bg-teal-400 text-white font-medium px-5 py-2 transition"
            >
              Add New Flat
            </button>
          </div>

          {isLoadingFlats ? (
            <LoadingSpinner />
          ) : flats.length > 0 ? (
            <div className="overflow-x-auto mt-2 shadow">
              <table className="w-full table-auto border-collapse rounded shadow-sm overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-left text-sm text-gray-700">
                    <th className="px-3 py-2 border">S.No.</th>
                    <th className="px-3 py-2 border">Flat ID</th>
                    <th className="px-3 py-2 border">Occupancy</th>
                    <th className="px-3 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-800">
                  {flats.map((flat, index) => (
                    <tr key={flat.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2 border">{index + 1}</td>
                      <td className="px-3 py-2 border">{flat.flat_id}</td>
                      <td className="px-3 py-2 border">{flat.occupancy || "No Info"}</td>
                      <td className="px-3 py-2 border">
                        <button
                          onClick={() => setViewingFlat(flat)}
                          className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded-md text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 mt-4">No flats found for this society.</p>
          )}
        </>
      ) : (
        <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-lg mt-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Flat Details - {viewingFlat.flat_id}</h2>
            <button
              onClick={() => setViewingFlat(null)}
              className="text-sm text-gray-600 hover:underline"
            >
              ← Back to list
            </button>
          </div>
          <div className="space-y-4 text-gray-800 text-sm">
            <div><strong>Occupancy:</strong> {viewingFlat.occupancy || 'No Info'}</div>
            <div>
              <strong>Owner Info:</strong>
              {viewingFlat.owner ? (
                <ul className="list-disc pl-5">
                  <li>Name: {viewingFlat.owner.name}</li>
                  <li>Email: {viewingFlat.owner.email}</li>
                  <li>Phone: {viewingFlat.owner.phone}</li>
                  <li>Address: {viewingFlat.owner.address}</li>
                  {viewingFlat.owner.initial_password != null && (
                    <li>Initial Password: {viewingFlat.owner.initial_password}</li>
                  )}
                </ul>
              ) : (
                <p>No Owner Info</p>
              )}
            </div>
            {viewingFlat.occupancy === "Rented" && viewingFlat.resident && (
              <div>
                <strong>Resident Info:</strong>
                <ul className="list-disc pl-5">
                  <li>Name: {viewingFlat.resident.name}</li>
                  <li>Email: {viewingFlat.resident.email}</li>
                  <li>Phone: {viewingFlat.resident.phone}</li>
                  <li>Address: {viewingFlat.resident.address}</li>
                </ul>
              </div>
            )}
            {/* documents info */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Documents</h3>
              {documents.length > 0 ? (
                <ul className="list-disc pl-6 space-y-1">
                  {documents.map(doc => (
                    <li key={doc.id} className="flex items-center justify-between">
                      <a
                        href={doc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {doc.document_name}
                      </a>
                      <button
                        onClick={() => {
                          setDocToDelete(doc.id);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm ml-4"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No documents uploaded.</p>
              )}

              <button
                onClick={() => setShowUploadForm(true)}
                className="mt-3 text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
              >
                Upload Document
              </button>

              {showUploadForm && (
                <form onSubmit={handleUpload} className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Document Title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="border px-3 py-1 rounded w-full"
                    required
                  />
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="border px-3 py-1 rounded w-full"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded"
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? "Uploading..." : "Submit"}
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={() => {
                handleEdit(viewingFlat);
                setViewingFlat(null);
              }}
              className="mt-4 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-md text-sm"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Modal for Flat Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="text-xl font-semibold underline mb-6">
              {isNewFlat ? "Add New Flat" : "Edit Flat Details"}
            </div>

            {/* Flat Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700">Flat Id</label>
                <input
                  type="text"
                  value={editedData.flat_id || ''}
                  onChange={(e) => handleChange("flat_id", e.target.value)}
                  className={`w-full border px-3 py-2 rounded-md ${validationErrors.flat_id ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.flat_id && <p className="text-red-500 text-sm mt-1">{validationErrors.flat_id}</p>}
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">Occupancy</label>
                <select
                  value={editedData.occupancy || ''}
                  onChange={(e) => handleChange("occupancy", e.target.value)}
                  className={`w-full border px-3 py-2 rounded-md ${validationErrors.occupancy ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Occupancy</option>
                  <option value="Rented">Rented</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Unoccupied">Unoccupied</option>
                </select>
                {validationErrors.occupancy && <p className="text-red-500 text-sm mt-1">{validationErrors.occupancy}</p>}
              </div>
            </div>

            {/* Owner Fields */}
            <div className="mb-4 p-3 border rounded-md bg-gray-50">
              <div className="font-semibold text-lg mb-3">Owner Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['name', 'email', 'phone', 'address'].map((field) => (
                  <div key={field}>
                    <label className="block mb-1 text-sm text-gray-700 capitalize" htmlFor={`owner-${field}`}>
                      {field}
                    </label>
                    <input
                      id={`owner-${field}`}
                      name={field}
                      type={
                        field === 'email'
                          ? 'email'
                          : field === 'phone'
                          ? 'tel'
                          : 'text'
                      }
                      {...(field === 'phone' && {
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                      })}
                      value={editedData.owner?.[field] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (field === 'phone') {
                          const digitsOnly = val.replace(/\D/g, '');
                          handleOwnerChange(field, digitsOnly);
                        } else {
                          handleOwnerChange(field, val);
                        }
                      }}
                      className={`w-full border px-3 py-2 rounded-md ${
                        validationErrors[
                          `owner${field.charAt(0).toUpperCase() + field.slice(1)}`
                        ]
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {validationErrors[
                      `owner${field.charAt(0).toUpperCase() + field.slice(1)}`
                    ] && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors[
                          `owner${field.charAt(0).toUpperCase() + field.slice(1)}`
                        ]}
                      </p>
                    )}
                  </div>
                ))}

                {/* Display initial_password if not null, read-only */}
                {editedData.owner?.initial_password != null && (
                  <div>
                    <label
                      className="block mb-1 text-sm text-gray-700 capitalize"
                      htmlFor="owner-initial_password"
                    >
                      initial_password
                    </label>
                    <input
                      id="owner-initial_password"
                      name="initial_password"
                      type="text"
                      value={editedData.owner.initial_password}
                      readOnly
                      className="w-full border px-3 py-2 rounded-md border-gray-300 bg-gray-100"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Resident (If Rented) */}
            {editedData.occupancy === 'Rented' && (
              <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <div className="font-semibold text-lg mb-3">Resident Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['name', 'email', 'phone', 'address'].map((field) => (
                    <div key={field}>
                      <label className="block mb-1 text-sm text-gray-700 capitalize">{field}</label>
                      <input
                        type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                        value={editedData.resident?.[field] || ''}
                        onChange={(e) => handleResidentChange(field, e.target.value)}
                        className={`w-full border px-3 py-2 rounded-md ${validationErrors[`resident${field.charAt(0).toUpperCase() + field.slice(1)}`] ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {validationErrors[`resident${field.charAt(0).toUpperCase() + field.slice(1)}`] && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors[`resident${field.charAt(0).toUpperCase() + field.slice(1)}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isNewFlat && (
              <div className="flex items-center gap-2 mt-4">
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
            )}

            {serverError && (
              <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-2 rounded-md mt-4">
                {serverError}
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setValidationErrors({});
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={saveAllData}
                disabled={saving || (!isNewFlat && !isConfirmed)}
                className={`px-5 py-2 flex items-center justify-center gap-2 rounded-md font-medium transition ${isNewFlat || isConfirmed ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : isNewFlat ? "Create Flat" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this document?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDocToDelete(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDoc}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                disabled={deleteLoading}
              >
                {deleteLoading ? <CircularProgress size={20} color="inherit" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyFlatSetup;
