import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmpassword, setConfirmpassword] = useState("");
  const [password, setPassword] = useState("");
  const [pic, setPic] = useState("");
  const [picLoading, setPicLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const submitHandler = async () => {
    setPicLoading(true);
    if (!name || !email || !password || !confirmpassword) {
      showMessage("Please Fill all the Fields", "warning");
      setPicLoading(false);
      return;
    }
    if (password !== confirmpassword) {
      showMessage("Passwords Do Not Match", "warning");
      setPicLoading(false);
      return;
    }
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/api/user",
        {
          name,
          email,
          password,
          pic,
        },
        config
      );
      showMessage("Registration Successful", "success");
      localStorage.setItem("userInfo", JSON.stringify(data));
      setPicLoading(false);
      navigate("/chats");
    } catch (error) {
      showMessage(error.response?.data?.message || "Error Occured!", "error");
      setPicLoading(false);
    }
  };

  const postDetails = (pics) => {
    setPicLoading(true);
    if (pics === undefined) {
      showMessage("Please Select an Image!", "warning");
      setPicLoading(false);
      return;
    }
    if (pics.type === "image/jpeg" || pics.type === "image/png") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "talkative");
      data.append("cloud_name", "dyhljjvdj");
      fetch("https://api.cloudinary.com/v1_1/dyhljjvdj/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setPic(data.url.toString());
          setPicLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setPicLoading(false);
        });
    } else {
      showMessage("Please Select a valid Image!", "warning");
      setPicLoading(false);
      return;
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      {message && (
        <div
          className={`p-3 text-sm rounded-md border ${message.type === "error" || message.type === "warning"
            ? "bg-red-50 text-red-600 border-red-200"
            : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-200">Name <span className="text-cyan-400">*</span></label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Your Name"
          className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm shadow-inner"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-200">Email Address <span className="text-cyan-400">*</span></label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter Your Email Address"
          className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm shadow-inner"
        />
      </div>

      <div className="space-y-1 relative">
        <label className="text-sm font-medium text-slate-200">Password <span className="text-cyan-400">*</span></label>
        <div className="relative flex items-center">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={show ? "text" : "password"}
            placeholder="Enter password"
            className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm shadow-inner"
          />
          <button
            type="button"
            className="absolute right-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg text-slate-200 transition-colors backdrop-blur-md"
            onClick={handleClick}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="space-y-1 relative">
        <label className="text-sm font-medium text-slate-200">Confirm Password <span className="text-cyan-400">*</span></label>
        <div className="relative flex items-center">
          <input
            value={confirmpassword}
            onChange={(e) => setConfirmpassword(e.target.value)}
            type={show ? "text" : "password"}
            placeholder="Confirm password"
            className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm shadow-inner"
          />
          <button
            type="button"
            className="absolute right-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg text-slate-200 transition-colors backdrop-blur-md"
            onClick={handleClick}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-200">Upload your Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => postDetails(e.target.files[0])}
          className="flex w-full rounded-xl border border-white/10 bg-white/5 file:border-0 file:bg-white/10 file:text-cyan-400 file:text-sm file:font-semibold file:px-4 file:py-3 file:mr-4 hover:file:bg-white/20 text-sm text-slate-300 focus:outline-none transition-all cursor-pointer backdrop-blur-sm shadow-inner"
        />
      </div>

      <button
        onClick={submitHandler}
        disabled={picLoading}
        className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0B0F14] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {picLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        Sign Up
      </button>
    </div>
  );
};

export default Signup;
