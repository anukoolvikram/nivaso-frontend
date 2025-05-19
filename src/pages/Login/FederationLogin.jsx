import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";


const FederationLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFederation, setIsFederation] = useState(false);
  const [numApartments, setNumApartments] = useState("");
  const [numTenements, setNumTenements] = useState("");
  const [fedName, setFedName] = useState("");
  const [isRegistered, setIsRegistered] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const navigate = useNavigate();

  const toggleForm = () => {
    setIsRegistered(!isRegistered);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFedName("");
    setNumApartments("");
    setNumTenements("");
    setErrorMessage("");
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
      const response = await fetch("http://localhost:5000/auth/federation/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setErrorMessage("");
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
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const payload = { email, password };

    try {
      const response = await fetch("http://localhost:5000/auth/federation/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setErrorMessage("");
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
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8 px-4">
      <div className="border-2 border-black p-6 bg-white shadow-lg rounded-md w-full max-w-xl">
        <h2 className="text-xl font-bold text-center text-black mb-5">
          Federation {isRegistered ? "Login" : "Registration"}
        </h2>

        {isRegistered ? (
          <form onSubmit={handleLogin}>
            <div className="mb-3 flex">
              <label className="w-1/3">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="mb-3 flex relative">
              <label className="w-1/3">Password:</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10"
                required
              />
              <span
                className="absolute right-3 mt-3 cursor-pointer text-gray-500"
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

            <div className="text-center mt-3">
              <button type="button" onClick={toggleForm} className="text-blue-600">
                Don't have an account? Register here
              </button>
            </div>
          </form>
        ) : (
          // Registration
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="mb-3 relative">
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10"
                required
              />
              <span
                className="absolute right-3 mt-3 cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </span>
            </div>


            <div className="mb-3 relative">
              <label>Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10"
                required
              />
              <span
                className="absolute right-3 mt-3 cursor-pointer text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </span>
            </div>
{/* 
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={isFederation}
                onChange={() => setIsFederation(!isFederation)}
                className="mr-2"
              />
              <label>Are you a Federation?</label>
            </div> */}

            {/* {isFederation && (
              <> */}
                <div className="mb-3">
                  <label>Federation Name</label>
                  <input
                    type="text"
                    value={fedName}
                    onChange={(e) => {
                      setFedName(e.target.value);
                      setErrorMessage("");
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label>Number of Apartments</label>
                  <input
                    type="number"
                    value={numApartments}
                    onChange={(e) => {
                      setNumApartments(e.target.value);
                      setErrorMessage("");
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label>Number of Tenements</label>
                  <input
                    type="number"
                    value={numTenements}
                    onChange={(e) => {
                      setNumTenements(e.target.value);
                      setErrorMessage("");
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
              {/* </>
            )} */}

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

export default FederationLogin;
