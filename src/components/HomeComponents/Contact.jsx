import { motion } from "framer-motion";
import React from "react";

const Contact = () => {
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }

  return (
    <div className="-mt-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full lg:w-6xl text-center font-bold text-3xl bg-gray-500 text-white py-2 rounded-xl shadow-lg"
      >
        CONTACT US
      </motion.div>

      <section id="support" className="px-4 md:px-8 2xl:px-0 mt-6">
        <div className="relative mx-auto max-w-c-1390 p-6">
          <div className="absolute left-0 top-0 -z-1 h-2/3 w-full rounded-lg bg-gradient-to-t from-transparent to-[#dee7ff47] dark:bg-gradient-to-t dark:to-[#252A42]"></div>
          
          <div className="flex flex-col-reverse flex-wrap gap-8 md:flex-row md:flex-nowrap md:justify-between xl:gap-10">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -20 },
                visible: { opacity: 1, y: 0 },
              }}
              initial="hidden"
              whileInView="visible"
              transition={{ duration: 1, delay: 0.1 }}
              viewport={{ once: true }}
              className="w-3/5 animate_top rounded-lg bg-white shadow-lg border border-strokedark p-6"
            >
              <div className="text-3xl font-semibold text-gray-700 xl:text-sectiontitle2 mb-3">
                Send a message
              </div>

              <form action="" method="">
                <div className="w-full mb-3 flex flex-col gap-7.5 lg:flex-row lg:justify-between">
                  <input type="text" placeholder="Full name" className="w-1/2 input-field border-2 p-2 rounded border-gray-200" />
                  <input type="emailj" placeholder="Email address" className="w-1/2 input-field border-2 p-2 rounded border-gray-200" />
                </div>

                <div className="w-full mb-3 flex flex-col gap-7.5 lg:flex-row lg:justify-between">
                  <input type="text" placeholder="Subject" className="w-1/2 input-field border-2 p-2 rounded border-gray-200" />
                  <input type="text" placeholder="Phone number" className="w-1/2 input-field border-2 p-2 rounded border-gray-200" />
                </div>

                <textarea
                  placeholder="Your Message"
                  rows={2}
                  className="w-full input-field resize-none mb-2 p-2 border-2 px-2 rounded border-gray-200"
                ></textarea>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" id="agree-checkbox" className="peer hidden" />
                    <span className="w-5 h-5 flex items-center justify-center border-2 border-gray-400 rounded-md peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all text-white text-sm">
                      ✓
                    </span>
                    <span className="text-gray-600 text-sm">
                      Agree to terms & consent to cookie usage
                    </span>
                  </label>
                
                  <div className="flex justify-start">
                    <button className="bg-gray-300 p-2 text-black">
                      Send
                    </button>
                  </div>

                </div>
              </form>
            </motion.div>

            {/* right side */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -20 },
                visible: { opacity: 1, y: 0 },
              }}
              initial="hidden"
              whileInView="visible"
              transition={{ duration: 2, delay: 0.1 }}
              viewport={{ once: true }}
              className="animate_top w-full md:w-2/5 md:p-7.5 lg:w-[30%] xl:pt-15"
            >

              <div className="mb-7">
                <h3 className="mb-2 text-metatitle3 font-medium text-black dark:text-white">Our Location</h3>
                <p className="text-black text-lg">Powai, Mumbai, 400076</p>
              </div>
              <div className="mb-7">
                <h3 className="mb-2 text-metatitle3 font-medium text-black dark:text-white">Email Address</h3>
                <a className="text-black text-lg" href="#">customer@nivaso.com</a>
              </div>
              <div>
                <h4 className="mb-2 text-metatitle3 font-medium text-black dark:text-white">Phone Number</h4>
                <a className="text-black text-lg" href="#">+91 9119974803</a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
