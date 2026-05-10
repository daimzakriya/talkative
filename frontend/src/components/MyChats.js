import { Plus } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, user, chats, setChats, chatTheme } = ChatState();

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      alert("Error Occured! Failed to Load the chats");
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <div
      className={`${
        selectedChat ? "hidden md:flex" : "flex"
      } flex-col items-center p-5 premium-glass w-full md:w-[31%] rounded-3xl`}
    >
      <div className="pb-5 px-1 text-3xl font-extrabold flex w-full justify-between items-center text-white drop-shadow-sm">
        Messages
        <GroupChatModal>
          <button className="flex items-center text-sm bg-white/10 hover:bg-white/20 text-slate-100 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm border border-white/20 backdrop-blur-md hover:scale-105 active:scale-95 group">
            New Group <Plus className="ml-2 w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </GroupChatModal>
      </div>
      <div className="flex flex-col flex-1 p-2 bg-white/5 w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-inner">
        {chats ? (
          <div className="overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20 h-full pb-4">
            {chats.map((chat) => (
              <div
                onClick={() => setSelectedChat(chat)}
                className={`cursor-pointer px-5 py-4 rounded-2xl transition-all duration-300 transform ${
                  selectedChat === chat
                    ? chatTheme === "neon"
                      ? "bg-gradient-to-br from-yellow-500/90 to-yellow-600/90 text-black shadow-[0_8px_30px_rgb(250,204,21,0.3)] scale-[1.02] border border-yellow-400/50"
                      : "bg-gradient-to-br from-cyan-500/90 to-blue-600/90 text-white shadow-[0_8px_30px_rgb(6,182,212,0.3)] scale-[1.02] border border-white/20"
                    : "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10 hover:shadow-lg hover:-translate-y-0.5"
                }`}
                key={chat._id}
              >
                <div className="font-bold tracking-tight text-[15px]">
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </div>
                {chat.latestMessage && (
                  <div className={`text-[13px] mt-1.5 truncate flex items-center ${selectedChat === chat ? (chatTheme === "neon" ? "text-slate-800" : "text-cyan-100") : "text-slate-400"}`}>
                    <span className="font-semibold mr-1">
                      {chat.latestMessage.sender.name.split(" ")[0]}:
                    </span>
                    {chat.latestMessage.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <ChatLoading />
        )}
      </div>
    </div>
  );
};

export default MyChats;
