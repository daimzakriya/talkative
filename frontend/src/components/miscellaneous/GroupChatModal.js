import axios from "axios";
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../userAvatar/UserBadgeItem";
import UserListItem from "../userAvatar/UserListItem";
import { X, Loader2 } from "lucide-react";

const GroupChatModal = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { user, chats, setChats } = ChatState();

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const handleGroup = (userToAdd) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) {
      alert("User already added");
      return;
    }
    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleSearch = async (query) => {
    if (!query) {
      setSearchResult([]);
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/api/user?search=${query}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      alert("Failed to Load the Search Results");
      setLoading(false);
    }
  };

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    if (!groupChatName || selectedUsers.length === 0) {
      alert("Please fill all the fields");
      return;
    }

    try {
      setSubmitLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `/api/chat/group`,
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        config
      );
      setChats([data, ...(chats || [])]);
      onClose();
      alert("New Group Chat Created!");
    } catch (error) {
      alert("Failed to Create the Chat!");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      {isOpen && typeof document !== "undefined" &&
        require("react-dom").createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
            <div className="glass-panel w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border-white/20 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                <h2 className="text-2xl font-work-sans font-bold text-white drop-shadow-sm">
                  Create Group Chat
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-300 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col flex-1 overflow-y-auto w-full">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Chat Name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all backdrop-blur-sm shadow-inner"
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Add Users eg: John, Daim, Jane"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all backdrop-blur-sm shadow-inner"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap w-full mt-4 mb-2">
                  {selectedUsers.map((u) => (
                    <UserBadgeItem
                      key={u._id}
                      user={u}
                      handleFunction={() => handleDelete(u)}
                    />
                  ))}
                </div>

                <div className="mt-2 flex-1 max-h-48 overflow-y-auto w-full pr-1 scrollbar-thin scrollbar-thumb-white/20 space-y-2">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin drop-shadow-lg" />
                    </div>
                  ) : (
                    searchResult
                      ?.slice(0, 4)
                      .map((searchUser) => (
                        <div className="bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                          <UserListItem
                            key={searchUser._id}
                            user={searchUser}
                            handleFunction={() => handleGroup(searchUser)}
                          />
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end bg-white/5 rounded-b-3xl">
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#0B0F14] rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.02] active:scale-95"
                >
                  {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Chat
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default GroupChatModal;
