import { X } from "lucide-react";

const UserBadgeItem = ({ user, handleFunction, admin }) => {
  return (
    <div
      className="inline-flex items-center px-3 py-1.5 m-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 cursor-pointer hover:bg-indigo-200 transition-colors border border-indigo-200 shadow-sm"
      onClick={handleFunction}
    >
      <span>{user.name}</span>
      {admin === user._id && <span className="ml-1 text-indigo-600 font-bold">(Admin)</span>}
      <div className="ml-1.5 p-0.5 rounded-full hover:bg-indigo-300 transition-colors">
        <X className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

export default UserBadgeItem;
