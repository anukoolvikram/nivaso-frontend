import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Features from "../../components/HomeComponents/Features";
import About from "../../components/HomeComponents/About";
import Contact from "../../components/HomeComponents/Contact";
import Pricing from "../../components/HomeComponents/Pricing";
import Testimonials from "../../components/HomeComponents/Testimonials";
import image from "../../assets/bgImage.jpg";

import "./styles.css";

const sections = ["hero", "features", "about", "pricing", "contact"];

const Home = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("token");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.3,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    setTimeout(() => {
      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (element) observer.observe(element);
      });
    }, 100);

    return () => {
      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (element) observer.unobserve(element);
      });
    };
  }, []);

  const handleNavClick = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const navbarHeight = document.querySelector("nav").offsetHeight;
      const offset = element.offsetTop - navbarHeight;
      window.scrollTo({ top: offset, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_type");
    navigate("/");
  };

  const handleDashboardNavigation = () => {
    const dashboard = localStorage.getItem("user_type");
    if (dashboard) {
      navigate(`/${dashboard}/dashboard`);
    }
  };

  const handleLoginNavigation = () => {
    console.log('navigating')
    navigate("/login");
  };

  return (
    <div className="relative bg-cover bg-center min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white flex items-center justify-between z-50 shadow-md">
        <h2
          className="text-xl font-bold ml-4 text-black cursor-pointer"
          onClick={() => handleNavClick("hero")}
        >
          Nivaso
        </h2>
        <div className="flex space-x-4 mr-4 bg-white p-2">
          {sections
            .filter((section) => section !== "hero")
            .map((section) => (
              <button
                key={section}
                onClick={() => handleNavClick(section)}
                className={`text-lg font-semibold px-4 py-2 rounded-md ${
                  activeSection === section ? "border-b-2 border-black" : ""
                }`}
                style={{
                  backgroundColor: "transparent",
                  color: "black",
                  transition: "background-color 0.3s, color 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#3B82F6";
                  e.target.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "black";
                }}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          <div className="ml-2 flex space-x-2">
            {!isLoggedIn ? (
              <button
                className="px-4 py-2 rounded-lg bg-gray-300 font-semibold text-lg hover:bg-blue-500 hover:text-white transition duration-300"
                onClick={handleLoginNavigation}
              >
                Login
              </button>
            ) : (
              <>
              <button
                onClick={handleDashboardNavigation}
                className="px-4 py-2 rounded-md bg-gray-800 text-white font-medium text-sm hover:bg-gray-700 transition-colors duration-200 shadow-sm"
              >
                Go to Dashboard
              </button>
            
              <button
                onClick={handleLogout}
                className="ml-3 px-4 py-2 rounded-md bg-red-100 text-red-700 font-medium text-sm hover:bg-red-200 transition-colors duration-200 shadow-sm"
              >
                Logout
              </button>
            </>
            
            )}
          </div>
        </div>
      </nav>

      {/* Sections */}
      {sections.map((section) => (
        <div
          key={section}
          id={section}
          className="min-h-screen flex items-center justify-center"
        >
          {section === "hero" && (
            <div className="relative w-full">
              {/* Background */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${image})` }}
              >
                <div className="absolute inset-0 bg-black opacity-60"></div>
              </div>

              {/* Hero Content */}
              <div className="relative flex flex-col items-center justify-center h-screen text-center px-6 mt-8">
                <h1 className="text-6xl font-bold text-white drop-shadow-lg">
                  Nivaso
                </h1>
                <p className="text-2xl text-white italic font-serif">
                  Less Managing, More Living
                </p>
                <p className="mt-2 text-md text-white opacity-90 max-w-2xl">
                  Nivaso simplifies society management, so you can focus on what
                  truly matters—your home, your community, and your peace of
                  mind.
                </p>
                <div className="flex items-center justify-center mt-4 space-x-6">
                  <button
                    className="px-6 py-2 text-lg font-semibold hover:bg-black hover:text-white text-black bg-white rounded-full shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => navigate("/login")}
                  >
                    Get Started
                  </button>
                  <button
                    className="px-6 py-2 text-lg font-semibold text-white border-1 border-white rounded-full hover:bg-black hover:text-black transition duration-300"
                    onClick={() => handleNavClick("features")}
                  >
                    Explore Features
                  </button>
                </div>
                <Testimonials />
              </div>
            </div>
          )}
          {section === "features" && <Features />}
          {section === "about" && <About />}
          {section === "pricing" && <Pricing />}
          {section === "contact" && <Contact />}
        </div>
      ))}
    </div>
  );
};

export default Home;
