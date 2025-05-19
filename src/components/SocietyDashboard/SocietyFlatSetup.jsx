import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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



    const navigate = useNavigate();

    useEffect(() => {
        if (societyCode) {
            fetchFlats();
        }
    }, [societyCode]);

    const fetchFlats = async () => {
        try {
            const response = await fetch(`/auth/society/getFlatsData/${societyCode}`);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            
            const sortedFlats = data.sort((a, b) => {
                const numA = parseInt(a.flat_id.replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(b.flat_id.replace(/\D/g, ''), 10) || 0;
                
                if (numA === numB) {
                    return a.flat_id.localeCompare(b.flat_id);
                }
                return numA - numB;
            });
            
            setFlats(sortedFlats);
        } catch (error) {
            console.error("Error fetching flats:", error);
        }
    };

    const handleEdit = (flat) => {
        setCurrentFlat(flat);
        setEditedData({
            ...flat,
            owner: flat.owner || { name: '', email: '', phone: '', address: '' },
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
            owner: { name: '', email: '', phone: '', address: '' },
            resident: { name: '', email: '', phone: '', address: '' }
        });
        setEditedData({
            flat_id: '',
            occupancy: '',
            owner: { name: '', email: '', phone: '', address: '' },
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
        if (!validateDetails()) {
            return;
        }
        
        try {
          const { id, flat_id, occupancy, owner, resident } = editedData;
      
          const endpoint = isNewFlat ? '/auth/society/createFlat' : '/auth/society/saveFlatsData';
      
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
                  resident_name: resident.name,
                  resident_email: resident.email,
                  resident_phone: resident.phone,
                  resident_address: resident.address
              }),
          });
      
          const data = await response.json();
          console.log(data);
      
          if (!response.ok) {
              if (data?.error) {
                  setServerError(data.error); // Show specific backend error
              } else {
                  setServerError("An error occurred while saving.");
              }
              return;
          }
      
          setShowModal(false);
          setIsNewFlat(false);
          setServerError("");
          fetchFlats();
      } catch (error) {
          console.error("Error saving flat data:", error);
          setServerError("Server error. Please try again later.");
      }
    };

    const validateDetails = () => {
        const errors = {};
        let isValid = true;

        // Basic flat validation
        if (!editedData.flat_id?.trim()) {
            errors.flat_id = "Flat ID is required";
            isValid = false;
        }
        
        if (!editedData.occupancy?.trim()) {
            errors.occupancy = "Occupancy is required";
            isValid = false;
        }

        // Owner validation
        if (ownerEntered || (editedData.owner && (editedData.owner.name || editedData.owner.email || editedData.owner.phone))) {
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

        // Resident validation
        if (editedData.occupancy === 'Rented' && 
            (residentEntered || (editedData.resident && (editedData.resident.name || editedData.resident.email || editedData.resident.phone)))) {
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
        setEditedData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleOwnerChange = (field, value) => {
        setOwnerEntered(true);
        setEditedData(prev => ({
            ...prev,
            owner: {
                ...prev.owner,
                [field]: value,
            },
        }));
    };

    const handleResidentChange = (field, value) => {
        setResidentEntered(true);
        setEditedData(prev => ({
            ...prev,
            resident: {
                ...prev.resident,
                [field]: value,
            },
        }));
    };
  

    return (
        <div className=" bg-white rounded-xl">
        
        {flats.length > 0 ? (
          <div className="overflow-x-auto mt-2 shadow">
            <table className="w-full table-auto border-collapse rounded shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-left text-sm text-gray-700">
                  <th className="px-3 py-2 border">S.No.</th>
                  <th className="px-3 py-2 border">Flat ID</th>
                  <th className="px-3 py-2 border">Occupancy</th>
                  <th className="px-3 py-2 border">Owner</th>
                  <th className="px-3 py-2 border">Resident</th>
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
                      {flat.owner ? (
                        <div className="space-y-1">
                          <p className="text-gray-600">Name: <span className="text-black">{flat.owner.name}</span></p>
                          <p className="text-gray-600">Email: <span className="text-black">{flat.owner.email}</span></p>
                          <p className="text-gray-600">Phone: <span className="text-black">{flat.owner.phone}</span></p>
                        </div>
                      ) : (
                        "No Info"
                      )}
                    </td>
                    <td className="p-3 border">
                      {flat.occupancy === 'Rented' && flat.resident ? (
                        <div className="space-y-1">
                          <p className="font-medium">{flat.resident.name}</p>
                          <p className="text-xs text-gray-600">{flat.resident.email}</p>
                          <p className="text-xs text-gray-600">{flat.resident.phone}</p>
                        </div>
                      ) : (
                        "No Info"
                      )}
                    </td>
                    <td className="p-3 border">
                      <button
                        onClick={() => handleEdit(flat)}
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
        ) : (
          <p className="text-gray-600">No flats found for this society.</p>
        )}

        <div className="flex items-end mt-6">
          {/* <h2 className="text-2xl font-semibold text-gray-800">Flat Management</h2> */}
          <button
            onClick={handleAddNew}
            className="bg-teal-500 hover:bg-teal-400 text-white font-medium px-5 py-2 rounded-lg transition"
          >
            Add New Flat
          </button>
        </div>
      
        {/* Modal for Add/Edit Flat */}
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
                    className={`w-full border px-3 py-2 rounded-md ${
                      validationErrors.flat_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.flat_id && <p className="text-red-500 text-sm mt-1">{validationErrors.flat_id}</p>}
                </div>
      
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Occupancy</label>
                  <select
                    value={editedData.occupancy || ''}
                    onChange={(e) => handleChange("occupancy", e.target.value)}
                    className={`w-full border px-3 py-2 rounded-md ${
                      validationErrors.occupancy ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Occupancy</option>
                    <option value="Rented">Rented</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Unoccupied">Unoccupied</option>
                  </select>
                  {validationErrors.occupancy && <p className="text-red-500 text-sm mt-1">{validationErrors.occupancy}</p>}
                </div>
              </div>
      
              {/* Owner Details */}
              <div className="mb-4 p-3 border rounded-md bg-gray-50">
                <div className="font-semibold text-lg mb-3">Owner Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["name", "email", "phone", "address"].map((field) => (
                    <div key={field}>
                      <label className="block mb-1 text-sm text-gray-700 capitalize">{field}</label>
                      <input
                        type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                        value={editedData.owner?.[field] || ''}
                        onChange={(e) => handleOwnerChange(field, e.target.value)}
                        className={`w-full border px-3 py-2 rounded-md ${
                          validationErrors[`owner${field.charAt(0).toUpperCase() + field.slice(1)}`]
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      />
                      {validationErrors[`owner${field.charAt(0).toUpperCase() + field.slice(1)}`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {validationErrors[`owner${field.charAt(0).toUpperCase() + field.slice(1)}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
      
              {/* Resident Details (if rented) */}
              {editedData.occupancy === 'Rented' && (
                <div className="mb-6 p-4 border rounded-md bg-gray-50">
                  <div className="font-semibold text-lg mb-3">Resident Details</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["name", "email", "phone", "address"].map((field) => (
                      <div key={field}>
                        <label className="block mb-1 text-sm text-gray-700 capitalize">{field}</label>
                        <input
                          type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                          value={editedData.resident?.[field] || ''}
                          onChange={(e) => handleResidentChange(field, e.target.value)}
                          className={`w-full border px-3 py-2 rounded-md ${
                            validationErrors[`resident${field.charAt(0).toUpperCase() + field.slice(1)}`]
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                        />
                        {validationErrors[`resident${field.charAt(0).toUpperCase() + field.slice(1)}`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {validationErrors[`resident${field.charAt(0).toUpperCase() + field.slice(1)}`]}
                          </p>
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
                disabled={!isNewFlat && !isConfirmed}
                className={`px-5 py-2 rounded-md font-medium transition ${
                  isNewFlat || isConfirmed
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isNewFlat ? "Create Flat" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
      
    );
};

export default SocietyFlatSetup;