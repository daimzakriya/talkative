const UserListItem = ({ user, handleFunction }) => {
  return (
    <div
      onClick={handleFunction}
      className="cursor-pointer bg-slate-100 hover:bg-indigo-500 hover:text-white w-full flex items-center text-slate-800 px-3 py-2 mb-2 rounded-lg transition-colors"
    >
      <img
        className="mr-3 w-8 h-8 rounded-full cursor-pointer object-cover border border-white/20"
        src={user.pic}
        alt={user.name}
      />
      <div>
        <p className="font-medium text-sm">{user.name}</p>
        <p className="text-xs opacity-90">
          <span className="font-semibold">Email : </span>
          {user.email}
        </p>
      </div>
    </div>
  );
};

export default UserListItem;
