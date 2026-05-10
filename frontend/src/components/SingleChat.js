import "./styles.css";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ArrowLeft, Pin, X } from "lucide-react";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import { Loader2 } from "lucide-react";

const ENDPOINT = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);

  const socketRef = useRef(null);
  const selectedChatCompareRef = useRef(null);

  const { selectedChat, setSelectedChat, user, setNotification } = ChatState();

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      setLoading(true);
      const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
      setMessages(data);
      setLoading(false);
      socketRef.current.emit("join chat", selectedChat._id);
    } catch (error) {
      showError("Failed to Load the Messages");
      setLoading(false);
    }
  };

  // Update pinned messages when selectedChat changes
  useEffect(() => {
    if (selectedChat?.pinnedMessages) {
      setPinnedMessages(selectedChat.pinnedMessages);
    } else {
      setPinnedMessages([]);
    }
  }, [selectedChat]);

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socketRef.current.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        const content = newMessage;
        setNewMessage("");
        const payload = { content, chatId: selectedChat._id };
        if (replyingTo) payload.replyTo = replyingTo._id;
        setReplyingTo(null);
        const { data } = await axios.post("/api/message", payload, config);
        socketRef.current.emit("new message", data);
        setMessages((prev) => [...prev, data]);
      } catch (error) {
        showError("Failed to send the Message");
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.delete(`/api/message/${messageId}`, config);
      socketRef.current.emit("delete message", data);
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data : m)));
    } catch (error) {
      showError("Failed to Delete the Message");
    }
  };

  const handleStarMessage = async (messageId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/message/${messageId}/star`, {}, config);
      socketRef.current.emit("message updated", data);
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data : m)));
    } catch (error) {
      showError("Failed to Star the Message");
    }
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(`/api/message/${messageId}/react`, { emoji }, config);
      socketRef.current.emit("message updated", data);
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data : m)));
    } catch (error) {
      showError("Failed to React to Message");
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(
        `/api/chat/${selectedChat._id}/pin/${messageId}`,
        {},
        config
      );
      socketRef.current.emit("message pinned", data);
      setPinnedMessages(data.pinnedMessages || []);
    } catch (error) {
      showError("Failed to Pin the Message");
    }
  };

  // Socket setup
  useEffect(() => {
    const socket = io(ENDPOINT, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompareRef.current ||
        selectedChatCompareRef.current._id !== newMessageRecieved.chat._id
      ) {
        setNotification((prev) => {
          if (prev.some((n) => n._id === newMessageRecieved._id)) return prev;
          return [newMessageRecieved, ...prev];
        });
        setFetchAgain((prev) => !prev);
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }
    });

    socket.on("message deleted", (deletedMessage) => {
      if (
        selectedChatCompareRef.current &&
        selectedChatCompareRef.current._id === deletedMessage.chat._id
      ) {
        setMessages((prev) =>
          prev.map((m) => (m._id === deletedMessage._id ? deletedMessage : m))
        );
      }
    });

    socket.on("message updated", (updatedMessage) => {
      if (
        selectedChatCompareRef.current &&
        selectedChatCompareRef.current._id === updatedMessage.chat._id
      ) {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
        );
      }
    });

    socket.on("message pinned", (updatedChat) => {
      if (
        selectedChatCompareRef.current &&
        selectedChatCompareRef.current._id === updatedChat._id
      ) {
        setPinnedMessages(updatedChat.pinnedMessages || []);
      }
    });

    return () => { socket.disconnect(); };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    selectedChatCompareRef.current = selectedChat;
    fetchMessages();
    // eslint-disable-next-line
  }, [selectedChat]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socketRef.current.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      if (timeNow - lastTypingTime >= timerLength && typing) {
        socketRef.current.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <div className="flex flex-col w-full h-full relative">
          {errorMessage && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-red-900/80 text-red-300 px-4 py-2 rounded-xl z-50 shadow-md border border-red-500/30 backdrop-blur text-sm">
              {errorMessage}
            </div>
          )}

          {/* Header */}
          <div className="text-xl md:text-2xl pb-3 pt-1 px-4 w-full font-extrabold flex justify-between items-center text-white drop-shadow-sm border-b border-white/10 mb-2 gap-4">
            <button
              className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md"
              onClick={() => setSelectedChat("")}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            {messages &&
              (!selectedChat.isGroupChat ? (
                <div className="flex w-full justify-between items-center tracking-tight">
                  {getSender(user, selectedChat.users)}
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                </div>
              ) : (
                <div className="flex w-full justify-between items-center tracking-tight">
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </div>
              ))}
          </div>

          {/* Pinned Messages Banner */}
          {pinnedMessages && pinnedMessages.length > 0 && (
            <div className="mx-2 mb-2 bg-[#1E293B]/80 border border-cyan-500/30 rounded-xl px-4 py-2 flex items-center gap-2 backdrop-blur shadow-sm">
              <Pin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-cyan-400 font-semibold mb-0.5">
                  {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-slate-300 truncate">
                  {pinnedMessages[pinnedMessages.length - 1]?.content || ""}
                </p>
              </div>
              <button
                onClick={() => handlePinMessage(pinnedMessages[pinnedMessages.length - 1]?._id || pinnedMessages[pinnedMessages.length - 1])}
                className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                title="Unpin latest"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat area */}
          <div className="flex flex-col justify-end p-4 premium-glass bg-[#0F172A]/40 backdrop-blur-3xl w-full h-full overflow-y-hidden relative rounded-2xl shadow-inner border border-white/[0.05]">
            {loading ? (
              <div className="flex items-center justify-center w-full h-full">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-y-auto w-full scrollbar-hide">
                <ScrollableChat
                  messages={messages}
                  handleDeleteMessage={handleDeleteMessage}
                  handleStarMessage={handleStarMessage}
                  handleReactToMessage={handleReactToMessage}
                  handlePinMessage={handlePinMessage}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  socket={socketRef.current}
                />
              </div>
            )}

            {/* Input area */}
            <div className="w-full mt-3">
              {/* Typing indicator */}
              {istyping && (
                <div className="flex items-center px-1 pb-3">
                  <span className="flex space-x-1.5 bg-[#1E293B]/80 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-white/5">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ animationDelay: "0.15s" }}></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ animationDelay: "0.3s" }}></span>
                  </span>
                </div>
              )}

              {/* Reply bar */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-[#1E293B] border border-cyan-500/30 rounded-xl px-4 py-2 mb-2">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-cyan-400 text-xs font-bold mb-0.5">
                      Replying to {replyingTo.sender?.name}
                    </p>
                    <p className="text-slate-300 text-sm truncate">{replyingTo.content}</p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="ml-3 text-slate-500 hover:text-white transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Message input */}
              <input
                className="w-full h-[52px] bg-[#1E293B] text-white placeholder-slate-400 rounded-full border border-white/10 px-6 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-lg transition-all"
                placeholder="Type a message and press Enter..."
                value={newMessage}
                onChange={typingHandler}
                onKeyDown={sendMessage}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white/80 to-white/30 text-center px-8 py-10 premium-glass rounded-3xl">
            Select a conversation
          </div>
        </div>
      )}
    </>
  );
};

export default SingleChat;
