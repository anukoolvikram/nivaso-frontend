import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ currentPage, onPageChange }) => {
  const navigate = useNavigate();
  const user_type = localStorage.getItem('user_type');

  function handleLogoClick() {
    navigate('/');
  }

  const federationPages = ["Society Setup", "Noticeboard"];
  const societyPages = ["Flat Setup", "Noticeboard", "Community", "Complaints", "Documents"];
  const residentPages = ["Profile","Noticeboard", "Community", "Complaints"];

  const pagesToShow = user_type === "resident" ? residentPages : user_type==="federation"? federationPages : societyPages;

  return (
    <div 
      style={{ backgroundColor: '#42A8B4' }} 
      className="w-1/5 min-h-screen text-white flex flex-col gap-3 px-1"
    >
      <img src="/nivasoLogo2.jpg" alt="Nivaso Logo" onClick={handleLogoClick} className="p-2 cursor-pointer mb-4 mt-2" />

      {pagesToShow.map((page) => (
        <button
          key={page}
          className={`py-2 px-4 text-left transition-all ${
            currentPage === page
              ? 'bg-white font-semibold text-black'
              : 'hover:bg-gray-700'
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
    </div>
  );
};

export default Sidebar;
