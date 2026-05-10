import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

function Homepage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) navigate("/chats");
  }, [navigate]);

  return (
    <div className="max-w-xl mx-auto flex flex-col justify-center items-center w-full min-h-screen px-4 relative z-10 py-12">
      <div className="absolute inset-0 bg-noise"></div>
      
      <div className="premium-glass flex justify-center p-6 w-full mb-8 rounded-2xl transform hover:scale-[1.02] transition-all duration-300">
        <h1 className="text-5xl font-extrabold tracking-tight text-gradient drop-shadow-sm">
          Talk-A-Tive
        </h1>
      </div>
      
      <div className="premium-glass w-full p-8 rounded-3xl relative overflow-hidden group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 -z-10"></div>
        
        <div className="flex space-x-2 bg-white/5 p-1.5 rounded-full mb-8 backdrop-blur-sm border border-white/10">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-500 ${
              activeTab === "login"
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-500 ${
              activeTab === "signup"
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Sign Up
          </button>
        </div>
        
        <div className="mt-4 min-h-[350px]">
          {activeTab === "login" ? <Login /> : <Signup />}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
