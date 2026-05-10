import { Bell, Search, ChevronDown, X, Loader2, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ChatLoading from "../ChatLoading";
import ProfileModal from "./ProfileModal";
import { getSender } from "../../config/ChatLogics";
import UserListItem from "../userAvatar/UserListItem";
import { ChatState } from "../../Context/ChatProvider";

function SideDrawer() {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const {
    setSelectedChat,
    user,
    notification,
    setNotification,
    chats,
    setChats,
    chatTheme,
    setChatTheme,
  } = ChatState();

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const toggleTheme = () => {
    const newTheme = chatTheme === "aqua" ? "neon" : "aqua";
    setChatTheme(newTheme);
    localStorage.setItem("chatTheme", newTheme);
  };

  const handleSearch = async () => {
    if (!search) {
      alert("Please Enter something in search");
      return;
    }

    try {
      setLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/user?search=${search}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      alert("Failed to Load the Search Results");
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);

      if (!chats?.find((c) => c._id === data._id)) setChats([data, ...(chats || [])]);
      setSelectedChat(data);
      setLoadingChat(false);
      setIsDrawerOpen(false);
    } catch (error) {
      alert("Error fetching the chat");
      setLoadingChat(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center glass-panel bg-black/20 w-full py-3 px-6 shadow-lg border-b border-white/10 backdrop-blur-3xl relative z-40">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center text-slate-100 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-sm backdrop-blur-md"
          title="Search Users to chat"
        >
          <Search className="w-5 h-5" />
          <span className="hidden md:flex ml-2 font-bold tracking-wide">Search User</span>
        </button>
        
        <div className="text-3xl font-extrabold font-sans text-gradient drop-shadow-md cursor-pointer hover:opacity-80 transition-opacity tracking-tight">
          Talk-A-Tive
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm border ${
              chatTheme === "neon" 
                ? "bg-[#1E293B] border-yellow-500/50 text-yellow-400 hover:bg-[#1E293B]/80 shadow-[0_0_15px_rgba(250,204,21,0.2)]" 
                : "bg-white/5 border-white/10 hover:bg-white/10 text-cyan-400"
            }`}
            title="Toggle Chat Theme"
          >
            <Palette className="w-5 h-5" />
          </button>
          
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm relative"
            >
              {notification.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-[#0B0F14] transform translate-x-1/4 -translate-y-1/4 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse">
                  {notification.length}
                </span>
              )}
              <Bell className="w-5 h-5 text-slate-100 drop-shadow-sm" />
            </button>
            
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-72 glass-panel bg-slate-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl py-2 border border-white/20 z-50">
                {!notification.length && <div className="px-5 py-3 text-sm font-medium text-slate-300">No New Messages</div>}
                {notification.map((notif) => (
                  <div
                    key={notif._id}
                    className="px-5 py-3 text-sm font-medium hover:bg-white/10 cursor-pointer text-slate-100 transition-colors border-b border-white/5 last:border-0"
                    onClick={() => {
                      setSelectedChat(notif.chat);
                      setNotification(notification.filter((n) => n !== notif));
                      setIsNotifOpen(false);
                    }}
                  >
                    {notif.chat.isGroupChat
                      ? `New Message in ${notif.chat.chatName}`
                      : `New Message from ${getSender(user, notif.chat.users)}`}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 pl-1.5 pr-3 py-1.5 rounded-full transition-all hover:shadow-md"
            >
              <img src={user.pic} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-white/20" />
              <ChevronDown className="w-4 h-4 text-slate-200" />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 glass-panel bg-slate-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl py-2 border border-white/20 z-50">
                <ProfileModal user={user}>
                  <div className="block px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 cursor-pointer transition-colors">My Profile</div>
                </ProfileModal>
                <div className="border-t border-white/10 my-1"></div>
                <div 
                  onClick={logoutHandler}
                  className="block px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-lg text-slate-800">Search Users</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 flex flex-col h-full">
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-10 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button 
              onClick={handleSearch}
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-md transition-colors"
            >
              Go
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => accessChat(user._id)}
                />
              ))
            )}
            {loadingChat && (
              <div className="flex justify-center mt-4">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SideDrawer;
