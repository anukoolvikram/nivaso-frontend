import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import FederationSocietySetup from '../../components/FederationDashboard/FederationSocietySetup';
import FederationNoticeboard from '../../components/FederationDashboard/FederationNoticeboard';
import FederationProfile from '../../components/FederationDashboard/FederationProfile';

const FederationDashboard = () => {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentDashboardPage') || "Profile";
  });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('token');
    const isFederation = localStorage.getItem('user_type') === 'federation';

    if (!isLoggedIn || !isFederation) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('currentDashboardPage', currentPage);
  }, [currentPage]);

  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="w-4/5 p-8">
        <div className="flex justify-between items-center mb-4 -mt-2">
          <div className="text-4xl font-semibold mb-6 text-gray-700">{currentPage}</div>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/')}
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
            >
              Logout
            </button>

          </div>
        </div>

        {/* Page-specific content */}
        {currentPage === "Profile" && (
          <div className="text-gray-700">
            <FederationProfile/>
          </div>
        )}
        {currentPage === "Society Setup" && (
          <div className="text-gray-700">
            <FederationSocietySetup/>
          </div>
        )}

         {currentPage === "Noticeboard" && (
          <div className="text-gray-700">
            <FederationNoticeboard/>
          </div>
        )}

        {/*{currentPage === "Community" && (
          <div className="text-gray-700">
            <p>Community</p>
          </div>
        )}
        {currentPage === "Complaints" && (
          <div className="text-gray-700">
            <p>Complaints</p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default FederationDashboard;
