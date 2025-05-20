import React from "react";
import { motion } from "framer-motion";

const Pricing = () => {
  const plans = [
    {
      title: "Free Plan",
      price: "0",
      btnClass: "bg-blue-500",
      btnTitle: "Sign up for free",
      features: ["Higher user base", "2 GB of storage", "Email support", "Help center access", "Lesser features"],
    },
    {
      title: "Premium Plan",
      price: "9.99",
      btnClass: "bg-green-500",
      btnTitle: "Available Soon!",
      features: ["Lesser user base", "10 GB of storage", "Priority email support", "Help center access", "Exclusive Features"],
    },
    // {
    //   title: "Premium Pro",
    //   price: "19.99",
    //   btnClass: "bg-green-500",
    //   btnTitle: "Get started",
    //   features: ["50 users included", "50 GB of storage", "24/7 support", "Help center access"],
    // },
  ];

  return (
    <div className="lg:-mt-16 mt-6">
       <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full lg:w-6xl text-center font-bold text-3xl bg-gray-500 text-white py-2 rounded-xl shadow-lg"  
      >
        PRICING
      </motion.div>
      <div className="flex flex-col md:flex-row gap-10 lg:gap-20 lg:ml-46 p-6">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            className="bg-white shadow-md p-6 w-80 text-center border border-gray-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <h4 className="text-3xl font-semibold mb-3">{plan.title}</h4>
            <h1 className="text-3xl font-bold mb-4">
              ${plan.price} <span className="text-gray-500 text-sm">/yr</span>
            </h1>
            <ul className="text-gray-600 mb-4 space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-md">{feature}</li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-2 rounded ${plan.btnClass} text-white font-semibold hover:opacity-80 transition duration-300`}
            >
              {plan.btnTitle}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
