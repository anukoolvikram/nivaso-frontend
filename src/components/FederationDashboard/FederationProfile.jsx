import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import CircularProgress from '@mui/material/CircularProgress';
import { useToast } from '../../context/ToastContext';
import { HiEye, HiEyeOff } from "react-icons/hi";
import LoadingSpinner from '../LoadingSpinner';


const FederationProfile = () => {
  const [federationData, setFederationData] = useState(null);
  const [loading, setLoading] = useState(true); // for initial fetch
  const [isSaving, setIsSaving] = useState(false); // for password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });


  const showToast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const { id } = jwtDecode(token);

    const fetchData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/federation/details/${id}`);
        setFederationData(res.data);
      } catch (err) {
        console.error('Failed to fetch federation details:', err);
        showToast('Could not load federation details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePasswordChange = async (e) => {
  e.preventDefault();

  if (passwordData.newPassword !== passwordData.confirmNewPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  try {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    const { id } = jwtDecode(token);

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/federation/change-password`, {
      federationId: id,
      ...passwordData,
    });

    showToast(response.data.message || 'Password updated successfully');
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setShowPasswordModal(false);
  } catch (err) {
    const msg = err.response?.data?.error || 'Failed to change password';
    showToast(msg, 'error');
    console.error('Password change error:', err);
  } finally {
    setIsSaving(false);
  }
};


  // 🔁 Initial fetch loader (SVG style)
  if (loading) {
    return (
     <LoadingSpinner/>
    );
  }

  return (
    <div className="max-w-3xl">
      {federationData && (
        <div className="w-1/2 space-y-4 bg-white p-6 rounded-lg border shadow-sm">
          <div className='flex justify-between'>
            <label className="font-medium text-gray-600">Federation Code</label>
            <div className="text-gray-800">{federationData.federation_code}</div>
          </div>

          <div className='flex justify-between'>
            <label className="font-medium text-gray-600">Name</label>
            <div className="text-gray-800">{federationData.name || 'N/A'}</div>
          </div>

          <div className='flex justify-between'>
            <label className="font-medium text-gray-600">Email</label>
            <div className="text-gray-800">{federationData.email}</div>
          </div>

          <div className='flex justify-between'>
            <label className="font-medium text-gray-600">Apartments</label>
            <div className="text-gray-800">{federationData.apartment || 'N/A'}</div>
          </div>

          <div className='flex justify-between'>
            <label className="font-medium text-gray-600">Tenements</label>
            <div className="text-gray-800">{federationData.tenement || 'N/A'}</div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition"
            >
              Change Password
            </button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
                <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <div className="relative">
                    <input
                    type={showPassword.current ? 'text' : 'password'}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full border rounded px-4 py-2 mt-1 pr-10"
                    />
                    <span
                    onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute top-3 right-3 cursor-pointer text-gray-500"
                    >
                    {showPassword.current ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                    </span>
                </div>
                </div>

                {/* New Password */}
                <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                    <input
                    type={showPassword.new ? 'text' : 'password'}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full border rounded px-4 py-2 mt-1 pr-10"
                    />
                    <span
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute top-3 right-3 cursor-pointer text-gray-500"
                    >
                    {showPassword.new ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                    </span>
                </div>
                </div>

                {/* Confirm Password */}
                <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="relative">
                    <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    required
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                    className="w-full border rounded px-4 py-2 mt-1 pr-10"
                    />
                    <span
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute top-3 right-3 cursor-pointer text-gray-500"
                    >
                    {showPassword.confirm ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                    </span>
                </div>
                </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isSaving}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex items-center justify-center gap-2 bg-teal-600 text-white font-medium px-5 py-2 rounded-md shadow-sm transition ${
                    isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700'
                  }`}
                >
                  {isSaving ? (
                    <CircularProgress size={18} style={{ color: 'white' }} />
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FederationProfile;
