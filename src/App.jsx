import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Home from "./pages/Home/Home";
import './App.css';
import Login from "./pages/Login/Login";
import FederationDashboard from "./pages/Dashboard/FederationDashboard";
import SocietyDashboard from "./pages/Dashboard/SocietyDashboard";
import ResidentDashboard from "./pages/Dashboard/ResidentDashboard";

const App = () => {
    const isAuthenticated = localStorage.getItem("token"); 

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<Home />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="login" element={<Login />} />

                    {/* <Route path='federation/societySetup' element={<SocietySetup />} /> */}
                    {/* <Route path="society/flatSetup" element={<FlatSetup/>} /> */}

                    <Route path='federation/dashboard' element={<FederationDashboard />} />
                    <Route path='society/dashboard' element={<SocietyDashboard />} />
                    <Route path='resident/dashboard' element={<ResidentDashboard />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;
