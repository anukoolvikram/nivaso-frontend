import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import CircularProgress from "@mui/material/CircularProgress";

const InputField = ({ label, name, type = "text", value, onChange, isPassword = false, showPassword, togglePassword }) => (
  <div className="mb-4 relative">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <div className="relative">
      <input
        type={isPassword && !showPassword ? "password" : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label}`}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10"
        required
      />
      {isPassword && (
        <span
          className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
          onClick={togglePassword}
        >
          {showPassword ? <HiEyeOff /> : <HiEye />}
        </span>
      )}
    </div>
  </div>
);

const SocietyLogin = () => {
  const [formData, setFormData] = useState({
    federationCode: "",
    societyCode: "",
    societyName: "",
    email: "",
    password: "",
    noOfWings: "",
    floorPerWing: "",
    roomsPerFloor: "",
    societyType: "Apartment", // default value
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);
  const [hasSocietyCode, setHasSocietyCode] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      if (value === "" || (!isNaN(value) && Number(value) > 0)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrorMessage("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiEndpoint = hasSocietyCode
        ? `${import.meta.env.VITE_BACKEND_URL}/auth/society/register`
        : `${import.meta.env.VITE_BACKEND_URL}/auth/society/self-register`;

      const body = hasSocietyCode
        ? {
            email: formData.email,
            password: formData.password,
            society_code: formData.societyCode,
            society_name: formData.societyName,
            no_of_wings: formData.noOfWings,
            floor_per_wing: formData.floorPerWing,
            rooms_per_floor: formData.roomsPerFloor,
          }
        : {
            email: formData.email,
            password: formData.password,
            society_name: formData.societyName,
            no_of_wings: formData.noOfWings,
            floor_per_wing: formData.floorPerWing,
            rooms_per_floor: formData.roomsPerFloor,
            society_type: formData.societyType, 
          };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user_type", data.user_type);
      localStorage.setItem("society_code", data.society_code);

      navigate("/society/dashboard", {
        state: { society_code: data.society_code },
      });
    } catch (error) {
      console.error("Registration Error:", error);
      setErrorMessage(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/society/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_type", data.user_type);
        localStorage.setItem("society_code", data.society_code);
        navigate("/society/dashboard");
      } else {
        setErrorMessage(data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsRegistered(!isRegistered);
    setErrorMessage("");
  };

  return (
    <div className="flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isRegistered ? "Society Login" : "Society Registration"}
        </h2>

        {isRegistered ? (
          <form onSubmit={handleLogin}>
            <InputField
              label="Email"
              name="loginEmail"
              type="email"
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value);
                setErrorMessage("");
              }}
            />
            <InputField
              label="Password"
              name="loginPassword"
              isPassword
              value={loginPassword}
              showPassword={showLoginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                setErrorMessage("");
              }}
              togglePassword={() => setShowLoginPassword(!showLoginPassword)}
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
              {loading ? <CircularProgress size={20} style={{ color: "white" }} /> : "Login"}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={toggleForm}
                className="text-blue-600 hover:underline text-sm"
                disabled={loading}
              >
                Don’t have an account? Register
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-4 text-sm">
              <label className="mr-4 font-medium">Do you already have a society code?</label>
              <label className="mr-4">
                <input
                  type="radio"
                  name="hasSocietyCode"
                  checked={hasSocietyCode}
                  onChange={() => setHasSocietyCode(true)}
                /> Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="hasSocietyCode"
                  checked={!hasSocietyCode}
                  onChange={() => setHasSocietyCode(false)}
                /> No
              </label>
            </div>

            <form onSubmit={handleRegister}>
              {hasSocietyCode && (
                <InputField label="Society Code" name="societyCode" value={formData.societyCode} onChange={handleChange} />
              )}
              {["societyName", "email", "password", "noOfWings", "floorPerWing", "roomsPerFloor"].map((field) => (
                <InputField
                  key={field}
                  label={field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
                  name={field}
                  type={field === "password" ? (showRegisterPassword ? "text" : "password") : field.includes("email") ? "email" : "text"}
                  isPassword={field === "password"}
                  showPassword={showRegisterPassword}
                  togglePassword={() => setShowRegisterPassword(!showRegisterPassword)}
                  value={formData[field]}
                  onChange={handleChange}
                />
              ))}


              {!hasSocietyCode && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Society Type</label>
                  <select
                    name="societyType"
                    value={formData.societyType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Tenement">Tenement</option>
                  </select>
                </div>
              )}

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
                {loading ? <CircularProgress size={20} style={{ color: "white" }} /> : "Register"}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={toggleForm}
                  className="text-blue-600 hover:underline text-sm"
                  disabled={loading}
                >
                  Already have an account? Login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SocietyLogin;
