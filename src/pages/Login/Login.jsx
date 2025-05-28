import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import FederationLogin from "./FederationLogin";
import SocietyLogin from "./SocietyLogin";
import ResidentLogin from "./ResidentLogin";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";

const components = {
  Federation: () => <div className="p-6 bg-white rounded-xl shadow-md w-full"><FederationLogin /></div>,
  Society: () => <div className="p-6 bg-white rounded-xl shadow-md w-full"><SocietyLogin /></div>,
  Resident: () => <div className="p-6 bg-white rounded-xl shadow-md w-full"><ResidentLogin /></div>,
};

export default function ButtonSwitcher() {
  const [active, setActive] = useState("Federation");
  const navigate = useNavigate();

  

// Inside your component:
const location = useLocation();

useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const role = localStorage.getItem('user_type');
      const currentPath = location.pathname;

      if ((role === "Federation" || role==='federation') && currentPath !== "/federation/dashboard") {
        navigate("/federation/dashboard", { replace: true });
      } else if ((role === "Society" || role==='society') && currentPath !== "/society/dashboard") {
        navigate("/society/dashboard", { replace: true });
      } else if ((role === "Resident" || role==='resident') && currentPath !== "/resident/dashboard") {
        navigate("/resident/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }
}, [navigate, location]);


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="w-full flex flex-row justify-between items-center p-4 bg-[#44A3B4] shadow-md">
        <img
          src="/nivasoLogo2.jpg"
          alt="Nivaso Logo"
          className="h-10 w-auto cursor-pointer"
          onClick={() => navigate("/")}
        />
        <button
          onClick={() => navigate("/")}
          className="sm:mt-0 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 transition"
        >
          Home
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-start sm:p-6">
        {/* Tab Buttons */}
        <div className="flex space-x-6 mb-8">
          {["Federation", "Society", "Resident"].map((comp) => (
            <div key={comp} className="flex flex-col items-center">
              <button
                onClick={() => setActive(comp)}
                className={`text-lg sm:text-xl lg:mt-2 mt-4 font-semibold transition-colors ${
                  active === comp ? "text-blue-600" : "text-gray-600 hover:text-blue-400"
                }`}
              >
                {comp}
              </button>
              {active === comp && (
                <motion.div
                  layoutId="underline"
                  className="h-1 w-12 mt-2 bg-blue-600 rounded"
                />
              )}
            </div>
          ))}
        </div>

        {/* Component Display */}
        <div className="w-full max-w-xl">{components[active]()}</div>
      </div>
    </div>
  );
}
