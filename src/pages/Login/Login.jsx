import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import FederationLogin from "./FederationLogin";
import SocietyLogin from "./SocietyLogin";
import ResidentLogin from "./ResidentLogin";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const components = {
  Federation: () => <div className="p-4 border rounded-lg"><FederationLogin/></div>,
  Society: () => <div className="p-4 border rounded-lg"><SocietyLogin/></div>,
  Resident: () => <div className="p-4 border rounded-lg"><ResidentLogin/></div>,
};

let decoded = null;
const token = localStorage.getItem('token');
if (token) {
  decoded = jwtDecode(token);
}

export default function ButtonSwitcher() {
  const [active, setActive] = useState("Federation");
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (token) {
  //     navigate('/');
  //   }
  // }, []);

  return (
    <div className="h-screen">
      <div className="flex flex-col items-center space-y-6 relative">
        {/* Home Button */}
        <div className="flex items-center justify-between w-full p-2" style={{ backgroundColor: "#44A3B4" }}>
          <img
            src="/nivasoLogo2.jpg"
            alt="Nivaso Logo"
            className="h-10 w-auto object-contain cursor-pointer"
          />
          <button
            onClick={() => navigate('/')}
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
          >
            Home
          </button>
        </div>


        {/* Selector Buttons */}
        <div className="relative flex space-x-6">
          {["Federation", "Society", "Resident"].map((comp) => (
            <div key={comp} className="flex flex-col items-center">
              <button
                onClick={() => setActive(comp)}
                className={`px-4 py-2 font-semibold transition-colors ${
                  active === comp ? "text-blue-600" : "text-gray-600"
                }`}
              >
                {comp}
              </button>
              {active === comp && (
                <motion.div
                  layoutId="underline"
                  className="h-1 w-12 bg-blue-600 rounded"
                />
              )}
            </div>
          ))}
        </div>

        {/* Selected Component */}
        <div className="w-full px-4 md:px-20">{components[active]()}</div>
      </div>
    </div>
  );
}
