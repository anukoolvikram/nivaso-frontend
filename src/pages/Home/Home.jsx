import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Features from "../../components/HomeComponents/Features";
import About from "../../components/HomeComponents/About";
import Contact from "../../components/HomeComponents/Contact";
import Pricing from "../../components/HomeComponents/Pricing";
import Testimonials from "../../components/HomeComponents/Testimonials";
import image from "../../assets/bgImage.jpg";
import { HiMenu, HiX } from "react-icons/hi";

const sections = ["hero", "features", "about", "pricing", "contact"];

const Home = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("token");

  useEffect(() => {
    const observerOptions = { root: null, rootMargin: "0px", threshold: 0.3 };
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
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
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_type");
    navigate("/");
  };

  const handleDashboardNavigation = () => {
    const dashboard = localStorage.getItem("user_type");
    if (dashboard) navigate(`/${dashboard}/dashboard`);
  };

  const handleLoginNavigation = () => navigate("/login");

  return (
    <div className="relative bg-cover bg-center min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <h2
            className="text-xl font-bold text-black cursor-pointer"
            onClick={() => handleNavClick("hero")}
          >
            Nivaso
          </h2>
          <div className="lg:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-black">
              {menuOpen ? <HiX size={28} /> : <HiMenu size={28} />}
            </button>
          </div>
          <div className="hidden lg:flex space-x-4 items-center">
            {sections
              .filter((s) => s !== "hero")
              .map((section) => (
                <button
                  key={section}
                  onClick={() => handleNavClick(section)}
                  className={`text-md px-4 py-2 font-medium transition ${
                    activeSection === section
                      ? "bg-gray-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            {!isLoggedIn ? (
              <button
                onClick={handleLoginNavigation}
                className="bg-white border hover:bg-gray-600 hover:text-white font-semibold px-4 py-2 transition"
              >
                Login
              </button>
            ) : (
              <>
                <button
                  onClick={handleDashboardNavigation}
                  className="bg-gray-800 text-white hover:bg-gray-700 font-medium px-4 py-2 rounded-md"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-100 text-red-700 hover:bg-red-200 font-medium px-4 py-2 rounded-md"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
        <div className="absolute top-full right-4 w-64 bg-white border rounded-md shadow-lg z-40 p-4 space-y-2 lg:hidden">
          {sections
            .filter((s) => s !== "hero")
            .map((section) => (
              <button
                key={section}
                onClick={() => handleNavClick(section)}
                className={`block w-full text-left text-md font-medium px-3 py-2 rounded-md ${
                  activeSection === section
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-blue-100"
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          {!isLoggedIn ? (
            <button
              onClick={handleLoginNavigation}
              className="block w-full bg-blue-500 text-white px-3 py-2 mt-2 rounded-md"
            >
              Login
            </button>
          ) : (
            <>
              <button
                onClick={handleDashboardNavigation}
                className="block w-full bg-gray-800 text-white px-4 py-2 mt-2 rounded-md"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="block w-full bg-red-100 text-red-700 px-4 py-2 mt-2 rounded-md"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}

      </nav>

      {/* Sections */}
      {sections.map((section) => (
        <div
          key={section}
          id={section}
             className={`w-full ${
              section === "hero"
                ? "min-h-screen flex items-center justify-center"
                : "py-12 sm:py-16 md:py-20"
            }`}
        >
          {section === "hero" && (
            <div className="relative w-full">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${image})` }}
              >
                <div className="absolute inset-0 bg-black opacity-60"></div>
              </div>

              <div className="relative flex flex-col items-center justify-center h-screen text-center px-4 sm:px-8">
                <h1 className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg mt-25">
                  Nivaso
                </h1>
                <p className="text-lg sm:text-2xl text-white italic font-serif mt-2">
                  Less Managing, More Living
                </p>
                <p className="mt-3 text-sm sm:text-md text-white opacity-90 max-w-2xl">
                  Nivaso simplifies society management, so you can focus on what
                  truly matters—your home, your community, and your peace of mind.
                </p>
                <div className="flex flex-wrap items-center justify-center mt-6 space-x-4">
                  <button
                    className="px-6 py-2 text-md sm:text-lg font-semibold hover:bg-black hover:text-white text-black bg-white rounded-full shadow-lg"
                    onClick={() => navigate("/login")}
                  >
                    Get Started
                  </button>
                  <button
                    className="px-6 py-2 text-md sm:text-lg font-semibold text-white border border-white rounded-full hover:bg-white hover:text-black"
                    onClick={() => handleNavClick("features")}
                  >
                    Explore Features
                  </button>
                </div>
                <div className="mt-10 w-full max-w-5xl">
                  <Testimonials />
                </div>
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
