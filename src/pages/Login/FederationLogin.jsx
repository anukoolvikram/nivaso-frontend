import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import CircularProgress from "@mui/material/CircularProgress";

// ✅ Moved outside to prevent re-creation on every render
const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  toggleIcon,
}) => (
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

const FederationLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFederation, setIsFederation] = useState(true);
  const [numApartments, setNumApartments] = useState("");
  const [numTenements, setNumTenements] = useState("");
  const [fedName, setFedName] = useState("");
  const [isRegistered, setIsRegistered] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFedName("");
    setNumApartments("");
    setNumTenements("");
    setErrorMessage("");
  };

  const toggleForm = () => {
    setIsRegistered(!isRegistered);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    const payload = {
      email,
      password,
      isFederation,
      name: fedName,
      apartment: isFederation ? numApartments : 0,
      tenement: isFederation ? numTenements : 0,
    };

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/federation/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("federation_code", data.federation_code);
        localStorage.setItem("user_type", data.user_type);
        localStorage.setItem("token", data.token);
        navigate("/federation/dashboard", {
          state: { federation_code: data.federation_code },
        });
      } else {
        setErrorMessage(data.error || "Registration failed. Try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const payload = { email, password };

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/federation/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("federation_code", data.federation_code);
        localStorage.setItem("user_type", data.user_type);
        navigate("/federation/dashboard", {
          state: { federation_code: data.federation_code },
        });
      } else {
        setErrorMessage(data.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-gray-50 items-center">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Federation {isRegistered ? "Login" : "Registration"}
        </h2>

        <form onSubmit={isRegistered ? handleLogin : handleSubmit}>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage("");
            }}
            placeholder="email@example.com"
          />

          <InputField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage("");
            }}
            placeholder="Enter password"
            icon={showPassword ? <HiEyeOff /> : <HiEye />}
            toggleIcon={() => setShowPassword(!showPassword)}
          />

          {!isRegistered && (
            <>
              <InputField
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Re-enter password"
                icon={showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                toggleIcon={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <InputField
                label="Federation Name"
                value={fedName}
                onChange={(e) => setFedName(e.target.value)}
                placeholder="E.g. Sunrise Housing Group"
              />

              <InputField
                label="Number of Apartments"
                type="number"
                value={numApartments}
                onChange={(e) => setNumApartments(e.target.value)}
                placeholder="E.g. 24"
              />

              <InputField
                label="Number of Tenements"
                type="number"
                value={numTenements}
                onChange={(e) => setNumTenements(e.target.value)}
                placeholder="E.g. 48"
              />
            </>
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
            {loading ? (
              <CircularProgress size={20} style={{ color: "white" }} />
            ) : (
              isRegistered ? "Login" : "Register"
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={toggleForm}
              className="text-blue-600 hover:underline text-sm"
              disabled={loading}
            >
              {isRegistered
                ? "Don't have an account? Register"
                : "Already registered? Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FederationLogin;
