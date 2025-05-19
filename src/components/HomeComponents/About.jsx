import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="mx-auto px-6 lg:px-12 py-10 space-y-16 lg:-mt-24">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full text-center  bg-gray-500 text-white pb-2 rounded-xl shadow-lg"
      >
        <span className="font-bold text-3xl">ABOUT US</span>
      </motion.h1>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-6">
        {/* Left: Our Story */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white p-8 rounded-3xl shadow-lg"
        >
          {/* <p className="text-md text-gray-700 leading-relaxed">
            <span className="font-bold text-primary">Nivaso</span> was founded with one core belief: managing residential communities shouldn't feel like a second job. 
          </p> */}

          {[
            { title: "Our Vision", description: "To create thriving, well-connected societies through technology and innovation." },
            { title: "Our Mission", description: "To simplify operations, enhance safety, and build meaningful engagement within communities." },
            { title: "Our Promise", description: "No ads. No clutter. Just clean, powerful tools for better living." }
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-4 group">
              {/* <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white font-semibold shadow-md group-hover:scale-110 transition">
                {index + 1}
              </div> */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Right: Our Uniqueness */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white p-8 rounded-3xl shadow-lg space-y-6"
        >
          <h2 className="ml-4 text-xl lg:text-xl font-bold text-gray-800">
            What Makes Nivaso Different?
          </h2>

          <ul className="space-y-4">
            {[
              "No Data Collection for Ads",
              "AI-Powered Community Blog",
              "Modular & Cost-Effective Setup",
              "On-Demand Support from Experts",
              "Simple, Intuitive, Elegant UI"
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-4 group">
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-600 text-white font-semibold shadow-md group-hover:scale-110 transition">
                  *
                </div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
