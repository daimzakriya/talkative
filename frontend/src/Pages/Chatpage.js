import { useState } from "react";
import Chatbox from "../components/Chatbox";
import MyChats from "../components/MyChats";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import { ChatState } from "../Context/ChatProvider";

const Chatpage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const { user } = ChatState();

  return (
    <div className="w-full flex flex-col min-h-screen relative z-10">
      <div className="absolute inset-0 bg-noise"></div>
      
      {user && <SideDrawer />}
      
      <div className="flex justify-between w-full h-[91.5vh] p-4 lg:p-6 space-x-4 lg:space-x-6 max-w-[1600px] mx-auto">
        {user && <MyChats fetchAgain={fetchAgain} />}
        {user && (
          <Chatbox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
      </div>
    </div>
  );
};

export default Chatpage;
