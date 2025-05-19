import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";

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
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [isRegistered, setIsRegistered] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

    try {
      const response = await fetch("/auth/society/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          society_code: formData.societyCode,
          society_name: formData.societyName,
          no_of_wings: formData.noOfWings,
          floor_per_wing: formData.floorPerWing,
          rooms_per_floor: formData.roomsPerFloor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user_type", data.user_type);
      localStorage.setItem("society_code", formData.societyCode);

      navigate("/society/dashboard", {
        state: { society_code: formData.societyCode },
      });
    } catch (error) {
      console.error("Error during registration:", error);
      setErrorMessage(error.message || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/auth/society/login", {
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

        navigate("/society/dashboard");
      } else {
        setErrorMessage(data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setErrorMessage("Server error");
    }
  };

  const toggleForm = () => {
    setIsRegistered(!isRegistered);
    setErrorMessage("");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8 px-4">
      <div className="border-2 border-black p-6 bg-white shadow-lg rounded-md w-full max-w-xl">
        <h2 className="text-xl font-bold text-center text-black mb-5">
          {isRegistered ? "Society Login" : "Society Registration"}
        </h2>

        {isRegistered ? (
          <form onSubmit={handleLogin}>
            <div className="mb-3 flex">
              <label className="w-1/3">Email:</label>
              <input
                type="email"
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
              <label className="w-1/3">Password:</label>
              <input
                type={showLoginPassword ? "text" : "password"}
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
                onClick={() => setShowLoginPassword(!showLoginPassword)}
              >
                {showLoginPassword ? <HiEyeOff /> : <HiEye />}
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
            <div className="text-center mt-3">
              <button type="button" onClick={toggleForm} className="text-blue-600">
                Don't have an account? Register here
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            {[
              { label: "Federation Code", name: "federationCode" },
              { label: "Society Code", name: "societyCode" },
              { label: "Society Name", name: "societyName" },
              { label: "Email", name: "email", type: "email" },
              {
                label: "Password",
                name: "password",
                type: showRegisterPassword ? "text" : "password",
                isPassword: true,
              },
              { label: "No of Wings", name: "noOfWings", type: "number" },
              { label: "Floor per Wing", name: "floorPerWing", type: "number" },
              { label: "Rooms per Floor", name: "roomsPerFloor", type: "number" },
            ].map(({ label, name, type = "text", isPassword }) => (
              <div key={name} className="mb-3 flex relative">
                <label className="w-1/3">{label}:</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={`Enter ${label}`}
                  className="w-full px-4 py-2 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-black"
                  required
                  min={type === "number" ? "1" : undefined}
                />
                {isPassword && (
                  <span
                    className="absolute right-3 top-2 cursor-pointer text-gray-500 text-xl"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  >
                    {showRegisterPassword ? <HiEyeOff /> : <HiEye />}
                  </span>
                )}
              </div>
            ))}

            {errorMessage && (
              <div className="mb-4 text-red-600 bg-red-100 border border-red-300 px-4 py-2 rounded">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-center mt-4">
              <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg">
                Register
              </button>
            </div>
            <div className="text-center mt-3">
              <button type="button" onClick={toggleForm} className="text-blue-600">
                Already have an account? Login here
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SocietyLogin;
