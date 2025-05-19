import { Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
// import Header from "../Header/Header";
// import Footer from "../Footer/Footer"; 

const Layout = () => {
    
    return (
        <div>
            {/* <Header/> */}
            <main>
                <Outlet /> 
            </main>
            {/* <Footer />  */}
        </div>
    );
};

export default Layout;
