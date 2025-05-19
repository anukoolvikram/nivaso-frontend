import axios from "axios";

const API_URL = `${import.meta.env.BACKEND_URL}/api/auth`; 

// Register User
export const registerUser = async (userData) => {
    return await axios.post(`${API_URL}/register`, userData);
};

// Login User
export const loginUser = async (userData) => {
    return await axios.post(`${API_URL}/login`, userData);
};
