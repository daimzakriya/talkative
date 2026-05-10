const ChatLoading = () => {
  return (
    <div className="flex flex-col space-y-2 w-full">
      {[...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className="h-[45px] w-full bg-slate-200 animate-pulse rounded-lg"
        ></div>
      ))}
    </div>
  );
};

export default ChatLoading;
