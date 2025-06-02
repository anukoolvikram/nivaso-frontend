import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import CircularProgress from "@mui/material/CircularProgress";

// ✅ Moved InputField outside the component
const InputField = ({ label, type = "text", value, onChange, placeholder, icon, toggleIcon }) => (
  <div className="mb-4 relative">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black pr-10"
        required
      />
      {icon && (
        <span
          className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
          onClick={toggleIcon}
        >
          {icon}
        </span>
      )}
    </div>
  </div>
);

const ResidentLogin = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false); // 🌀

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resident/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_type", data.user_type);
        localStorage.setItem("society_code", data.society_code);
        setErrorMessage("");
        navigate("/resident/dashboard");
      } else {
        setErrorMessage(data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setErrorMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-cente bg-gray-50">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Resident Login
        </h2>

        <form onSubmit={handleLogin}>
          <InputField
            label="Email"
            type="email"
            value={loginEmail}
            onChange={(e) => {
              setLoginEmail(e.target.value);
              setErrorMessage("");
            }}
            placeholder="email@example.com"
          />

          <InputField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={loginPassword}
            onChange={(e) => {
              setLoginPassword(e.target.value);
              setErrorMessage("");
            }}
            placeholder="Enter your password"
            icon={showPassword ? <HiEyeOff /> : <HiEye />}
            toggleIcon={() => setShowPassword(!showPassword)}
          />

          {errorMessage && (
            <div className="mb-4 text-sm text-red-700 bg-red-100 px-4 py-2 rounded border border-red-300">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 bg-black text-white py-2 rounded-lg hover:bg-gray-900 transition flex justify-center items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} style={{ color: "white" }} />
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResidentLogin;
