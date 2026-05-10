import { useEffect, useRef, useState, useCallback } from "react";
import EmojiPicker from "emoji-picker-react";
import { createPortal } from "react-dom";
import {
  isLastMessage,
  isSameSender,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import {
  Trash2, Star, Pin, Copy, Reply, Info, ChevronDown, X, Forward
} from "lucide-react";
import ForwardModal from "./miscellaneous/ForwardModal";

const MessageInfoModal = ({ message, onClose }) => {
  if (!message) return null;
  const sent = new Date(message.createdAt);
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0F172A] border border-white/10 rounded-2xl p-6 w-80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">Message Info</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500 font-medium">Sent</span>
            <span>{sent.toLocaleDateString()} at {sent.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500 font-medium">Sender</span>
            <span>{message.sender?.name}</span>
          </div>
          {message.replyTo && (
            <div className="text-slate-400 border-t border-white/10 pt-3">
              <span className="text-slate-500 font-medium">Replying to:</span>
              <p className="mt-1 text-slate-300 truncate">{message.replyTo.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const ContextMenu = ({
  message,
  isSentByMe,
  position,
  onClose,
  onReply,
  onCopy,
  onStar,
  onPin,
  onDelete,
  onInfo,
  onReact,
  isStarred,
  isPinned,
  isDeleted,
  onForward,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const items = [
    { icon: Info, label: "Message info", action: onInfo },
    { icon: Reply, label: "Reply", action: onReply },
    { icon: Copy, label: "Copy", action: onCopy },
    { icon: Forward, label: "Forward", action: onForward },
    { icon: null, label: "React", action: onReact, isEmoji: true },
    { icon: Pin, label: isPinned ? "Unpin" : "Pin", action: onPin },
    { icon: Star, label: isStarred ? "Unstar" : "Star", action: onStar },
    ...(isSentByMe && !isDeleted
      ? [{ icon: Trash2, label: "Delete", action: onDelete, danger: true }]
      : []),
  ];

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl py-1 w-48 overflow-hidden"
      style={{ top: position.y, left: position.x }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={(e) => { item.action(e); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors text-left ${
            item.danger ? "text-red-400 hover:text-red-300" : "text-slate-200"
          }`}
        >
          {item.icon && <item.icon className={`w-4 h-4 flex-shrink-0 ${item.danger ? "text-red-400" : "text-slate-400"}`} />}
          {item.isEmoji && <span className="text-base">😊</span>}
          {item.label}
          {item.label === "Star" || item.label === "Unstar" ? (
            <Star className={`w-3.5 h-3.5 ml-auto ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-slate-500"}`} />
          ) : null}
        </button>
      ))}
    </div>,
    document.body
  );
};

const ScrollableChat = ({ messages, handleDeleteMessage, handleStarMessage, handleReactToMessage, handlePinMessage, replyingTo, setReplyingTo, socket }) => {
  const { user, chatTheme, selectedChat } = ChatState();
  const messagesEndRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null); // { messageId, position }
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // messageId
  const [emojiPickerPos, setEmojiPickerPos] = useState({ x: 0, y: 0 });
  const [infoMessage, setInfoMessage] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  // Slide-to-reveal timestamp
  const [slidingMessage, setSlidingMessage] = useState(null);
  const dragStartX = useRef(null);
  const [copyToast, setCopyToast] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const openContextMenu = useCallback((e, messageId) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 320);
    setContextMenu({ messageId, position: { x, y } });
  }, []);

  const handleMouseDown = (e, messageId) => {
    dragStartX.current = e.clientX;
  };

  const handleMouseUp = (e, messageId) => {
    if (dragStartX.current !== null) {
      const diff = dragStartX.current - e.clientX;
      if (diff > 40) {
        setSlidingMessage(messageId);
        setTimeout(() => setSlidingMessage(null), 2500);
      }
    }
    dragStartX.current = null;
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const openEmojiPicker = (e, messageId) => {
    const rect = e.target.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 360);
    const y = Math.min(rect.bottom + 4, window.innerHeight - 460);
    setEmojiPickerPos({ x, y });
    setShowEmojiPicker(messageId);
  };

  return (
    <div className="flex flex-col h-full space-y-1 py-2 px-3 relative">
      {/* Copy toast */}
      {copyToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#1E293B] text-cyan-400 text-sm font-semibold px-4 py-2 rounded-full border border-white/10 shadow-lg z-[9999] animate-in fade-in slide-in-from-top-2">
          Copied!
        </div>
      )}

      {/* Message Info Modal */}
      {infoMessage && (
        <MessageInfoModal message={infoMessage} onClose={() => setInfoMessage(null)} />
      )}

      {/* Context Menu */}
      {contextMenu && (() => {
        const msg = messages.find((m) => m._id === contextMenu.messageId);
        if (!msg) return null;
        const isSentByMe = msg.sender._id === user._id;
        const isStarred = msg.starredBy?.includes(user._id);
        const isPinned = selectedChat?.pinnedMessages?.some(
          (pm) => (pm._id || pm) === msg._id
        );
        return (
          <ContextMenu
            message={msg}
            isSentByMe={isSentByMe}
            position={contextMenu.position}
            onClose={() => setContextMenu(null)}
            onReply={() => setReplyingTo(msg)}
            onCopy={() => handleCopy(msg.content)}
            onStar={() => handleStarMessage(msg._id)}
            onPin={() => handlePinMessage(msg._id)}
            onDelete={() => handleDeleteMessage(msg._id)}
            onInfo={() => setInfoMessage(msg)}
            onReact={(e) => openEmojiPicker(e, msg._id)}
            onForward={() => setForwardMessage(msg)}
            isStarred={isStarred}
            isPinned={isPinned}
            isDeleted={msg.isDeleted}
          />
        );
      })()}

      {/* Forward Modal */}
      {forwardMessage && (
        <ForwardModal
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
          socket={socket}
        />
      )}

      {/* Emoji Picker Portal */}
      {showEmojiPicker && createPortal(
        <div
          className="fixed z-[9999]"
          style={{ top: emojiPickerPos.y, left: emojiPickerPos.x }}
        >
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(null)}
              className="absolute top-2 right-2 z-10 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
            <EmojiPicker
              theme="dark"
              onEmojiClick={(emojiData) => {
                handleReactToMessage(showEmojiPicker, emojiData.emoji);
                setShowEmojiPicker(null);
              }}
              height={420}
              width={340}
            />
          </div>
        </div>,
        document.body
      )}

      {messages && messages.map((m, i) => {
        const isSentByMe = m.sender._id === user._id;
        const isDeleted = m.isDeleted;
        const timeString = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const isStarred = m.starredBy?.includes(user._id);
        const isSliding = slidingMessage === m._id;

        return (
          <div
            className="flex items-end relative group"
            key={m._id}
            style={{ marginTop: isSameUser(messages, m, i, user._id) ? 4 : 12 }}
            onContextMenu={(e) => openContextMenu(e, m._id)}
            onMouseDown={(e) => handleMouseDown(e, m._id)}
            onMouseUp={(e) => handleMouseUp(e, m._id)}
          >
            {/* Avatar for received */}
            {!isSentByMe && (isSameSender(messages, m, i, user._id) || isLastMessage(messages, i, user._id)) && (
              <div title={m.sender.name} className="mr-2 mb-1 flex-shrink-0">
                <img className="w-8 h-8 rounded-full border border-white/10 object-cover" src={m.sender.pic} alt={m.sender.name} />
              </div>
            )}

            {/* Timestamp revealed on slide */}
            {isSliding && (
              <span className="absolute right-0 -translate-x-full pr-3 text-[11px] text-slate-400 whitespace-nowrap animate-in fade-in slide-in-from-right-4 duration-300" style={{ bottom: 4 }}>
                {timeString}
              </span>
            )}

            {/* Hover caret button - moved INSIDE bubble wrapper below */}

            <div
              className="flex flex-col"
              style={{
                marginLeft: isSentByMe
                  ? "auto"
                  : (isSameSender(messages, m, i, user._id) || isLastMessage(messages, i, user._id))
                    ? 0
                    : 40,
                maxWidth: "70%",
                minWidth: 80,
                transform: isSliding ? "translateX(-48px)" : "translateX(0)",
                transition: "transform 0.3s ease",
              }}
            >
              {/* Reply quote block */}
              {m.replyTo && !isDeleted && (
                <div
                  className={`text-[12px] px-3 py-1.5 rounded-t-lg mb-0.5 border-l-2 ${
                    isSentByMe
                      ? "bg-blue-700/40 border-cyan-300 text-cyan-100"
                      : "bg-white/5 border-slate-400 text-slate-300"
                  } truncate`}
                >
                  <span className="font-bold block">{m.replyTo.sender?.name}</span>
                  <span className="opacity-80">{m.replyTo.content}</span>
                </div>
              )}

              {/* Bubble */}
              <span
                className={`px-4 py-2 text-[14.5px] font-medium inline-block relative ${
                  m.replyTo && !isDeleted ? "rounded-b-[20px] rounded-tr-[20px]" : "rounded-[20px]"
                } ${
                  isDeleted
                    ? `italic text-slate-400 bg-white/5 border border-white/10 ${isSentByMe ? "rounded-br-[4px]" : "rounded-bl-[4px]"}`
                    : isSentByMe
                      ? chatTheme === "neon"
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-[0_4px_15px_rgba(250,204,21,0.3)] rounded-br-[4px] border border-yellow-300/50"
                        : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] rounded-br-[4px]"
                      : "bg-[#1E293B] border border-white/[0.05] text-slate-100 rounded-bl-[4px]"
                }`}
              >
                {/* Caret button — floats on top corner of bubble */}
                {!isDeleted && (
                  <button
                    className={`absolute top-1 opacity-0 group-hover:opacity-100 p-0.5 rounded-full bg-black/30 hover:bg-black/50 shadow transition-all z-10 ${isSentByMe ? "right-1" : "left-1"}`}
                    onClick={(e) => { e.stopPropagation(); openContextMenu(e, m._id); }}
                    title="More options"
                  >
                    <ChevronDown className="w-3 h-3 text-white/80" />
                  </button>
                )}
                <span className="break-words block leading-snug">{isDeleted ? "🚫 This message was deleted" : m.content}</span>
                <span className={`text-[10px] font-semibold opacity-60 ml-3 float-right mt-1 ${isSentByMe && !isDeleted && chatTheme === "neon" ? "text-slate-800" : "text-slate-300"}`}>
                  {timeString}
                  {isStarred && !isDeleted && <span className="ml-1">⭐</span>}
                </span>
              </span>

              {/* Reactions pill */}
              {!isDeleted && m.reactions && m.reactions.length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1 ${isSentByMe ? "justify-end" : "justify-start"}`}>
                  <div className="flex bg-[#1E293B] border border-white/10 rounded-full px-2 py-0.5 gap-1 shadow text-sm">
                    {[...new Map(m.reactions.map((r) => [r.emoji, r])).values()].map((r) => {
                      const count = m.reactions.filter((rx) => rx.emoji === r.emoji).length;
                      return (
                        <span key={r.emoji} className="cursor-pointer hover:scale-110 transition-transform" title={`${count} reaction(s)`}>
                          {r.emoji}{count > 1 && <sup className="text-slate-400 text-[9px]">{count}</sup>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};

export default ScrollableChat;
