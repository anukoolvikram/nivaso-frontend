import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext'; // Replace path if needed
import { HiEye, HiEyeOff } from "react-icons/hi";


const ResidentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const showToast = useToast();

  const token = localStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.id;

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);


//   console.log(decoded)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // console.log(userId)
        const res = await axios.get(`http://localhost:5000/residentProfile/${userId}`);

        // console.log(res.data)
        setProfile(res.data);
        setFormData(res.data);
      } catch (err) {
        showToast('Failed to load profile', 'error');
      }
    };
    if (userId) fetchProfile();
  }, [userId, showToast]);

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/residentProfile/${userId}`, formData);
      setProfile({ ...profile, ...formData });
      setEditMode(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast('Error updating profile', 'error');
    }
  };

  const handlePasswordChange = async () => {
    try {
      await axios.put(`http://localhost:5000/residentProfile/${userId}/password`, passwords);
      setPasswords({ oldPassword: '', newPassword: '' });
      setPasswordMode(false);
      showToast('Password changed successfully!', 'success');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Error changing password', 'error');
    }
  };

  if (!profile) {
    return <div className="text-center py-8 text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        {/* <h2 className="text-xl font-semibold text-gray-800">Resident Profile</h2> */}
        {(editMode || passwordMode) && (
          <button
            onClick={() => {
              setEditMode(false);
              setPasswordMode(false);
            }}
            className="flex items-center text-gray-600 hover:text-black transition"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
        )}
      </div>

      {!editMode && !passwordMode && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-gray-700">
            <div className="font-medium">Name:</div>
            <div>{profile.name}</div>

            <div className="font-medium">Email:</div>
            <div>{profile.email}</div>

            <div className="font-medium">Phone:</div>
            <div>{profile.phone}</div>

            <div className="font-medium">Address:</div>
            <div>{profile.address}</div>

            <div className="font-medium">Flat ID:</div>
            <div>{profile.flat_id}</div>

            <div className="font-medium">Society Code:</div>
            <div>{profile.society_code}</div>
            </div>

            <div className="flex gap-4 mt-6">
            <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 transition text-sm font-medium"
            >
            Edit Profile
            </button>
            <button
            onClick={() => setPasswordMode(true)}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-400 transition text-sm font-medium"
            >
            Change Password
            </button>
            </div>

        </>
      )}

      {editMode && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
            <input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-teal-500 text-white hover:bg-teal-400 transition"
            >
              Save
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    {passwordMode && (
    <div className="space-y-4 border-t pt-4">
        <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Old Password</label>
        <div className="relative">
            <input
            type={showOldPassword ? 'text' : 'password'}
            value={passwords.oldPassword}
            onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
            className="w-full border rounded px-3 py-2 pr-10"
            />
            <button
            type="button"
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
            onClick={() => setShowOldPassword((prev) => !prev)}
            >
            {showOldPassword ? <HiEyeOff /> : <HiEye />}
            </button>
        </div>
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
        <div className="relative">
            <input
            type={showNewPassword ? 'text' : 'password'}
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            className="w-full border rounded px-3 py-2 pr-10"
            />
            <button
            type="button"
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
            onClick={() => setShowNewPassword((prev) => !prev)}
            >
            {showNewPassword ? <HiEyeOff /> : <HiEye />}
            </button>
        </div>
        </div>

        <div className="flex gap-4 mt-4">
        <button
            onClick={handlePasswordChange}
            className="px-4 py-2 bg-teal-500 text-white hover:bg-teal-400 transition"
        >
            Update Password
        </button>
        <button
            onClick={() => setPasswordMode(false)}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 transition"
        >
            Cancel
        </button>
        </div>
    </div>
    )}

    </div>
  );
};

export default ResidentProfile;
