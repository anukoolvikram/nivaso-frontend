import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";

const ResidentLogin = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/auth/resident/login", {
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
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8 px-4">
      <div className="border-2 border-black p-6 bg-white shadow-lg rounded-md w-full max-w-xl">
        <h2 className="text-xl font-bold text-center text-black mb-5">
          Resident Login
        </h2>

        <form onSubmit={handleLogin}>
          <div className="mb-3 flex">
            <label className="form-label w-1/3">Email:</label>
            <input
              type="email"
              name="email"
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value);
                setErrorMessage("");
              }}
              placeholder="email@example.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="mb-3 flex relative">
            <label className="form-label w-1/3">Password:</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                setErrorMessage("");
              }}
              placeholder="Enter password"
              className="w-full px-4 py-2 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <span
              className="absolute right-3 top-2 cursor-pointer text-gray-500 text-xl"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </span>
          </div>

          {errorMessage && (
            <div className="mb-4 text-red-600 bg-red-100 border border-red-300 px-4 py-2 rounded">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-center mt-4">
            <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResidentLogin;
