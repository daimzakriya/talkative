import {
  X,
  Search,
  Check,
  Loader2,
  Send,
} from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";
import { createPortal } from "react-dom";
import { getSender } from "../../config/ChatLogics";

const ForwardModal = ({ message, onClose, socket }) => {
  const [selectedChats, setSelectedChats] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const { user, chats, setChats } = ChatState();

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get(`/api/user?search=${search}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleGroup = (chatToAdd) => {
    if (selectedChats.some((c) => c._id === chatToAdd._id)) return;
    setSelectedChats([...selectedChats, chatToAdd]);
  };

  const handleDelete = (delChat) => {
    setSelectedChats(selectedChats.filter((sel) => sel._id !== delChat._id));
  };

  const onForward = async () => {
    if (selectedChats.length === 0) return;
    try {
      setSending(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      // Forward to each selected chat/user
      for (const target of selectedChats) {
        let chatId = target._id;
        
        // If it's a user from search, we need to access/create chat first
        if (!target.users) {
          const { data } = await axios.post("/api/chat", { userId: target._id }, config);
          chatId = data._id;
          if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
        }

        const { data: newMessage } = await axios.post(
          "/api/message",
          { content: message.content, chatId },
          config
        );
        
        if (socket) socket.emit("new message", newMessage);
      }

      setSending(false);
      onClose();
    } catch (error) {
      setSending(false);
      alert("Failed to forward message");
    }
  };

  // Combine recent chats and search results
  const displayItems = search ? searchResult : chats || [];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Forward message</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search contacts or groups..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Selected Items Badges */}
          {selectedChats.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              {selectedChats.map((c) => (
                <div key={c._id} className="flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full text-xs font-semibold border border-cyan-500/30">
                  {c.chatName || c.name || (c.users ? getSender(user, c.users) : "")}
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleDelete(c)} />
                </div>
              ))}
            </div>
          )}

          {/* List of Chats/Users */}
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : displayItems.length > 0 ? (
              displayItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleGroup(item)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                    selectedChats.some((c) => c._id === item._id)
                      ? "bg-cyan-500/10 border border-cyan-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <img
                    src={item.pic || (item.users ? (item.users.find(u => u._id !== user._id)?.pic) : "")}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {item.chatName || item.name || (item.users ? getSender(user, item.users) : "")}
                    </p>
                    {item.email && <p className="text-slate-500 text-xs truncate">{item.email}</p>}
                  </div>
                  {selectedChats.some((c) => c._id === item._id) && (
                    <Check className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8 text-sm">No results found</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
                Message: <span className="text-slate-300 italic">"{message.content.substring(0, 30)}..."</span>
            </p>
            <button
                onClick={onForward}
                disabled={selectedChats.length === 0 || sending}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:opacity-50 text-slate-900 font-bold px-6 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Forward
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ForwardModal;
