import { Eye, X } from "lucide-react";
import { useState } from "react";

const ProfileModal = ({ user, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <button 
          className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 transition-colors" 
          onClick={onOpen}
        >
          <Eye className="w-5 h-5 text-slate-600" />
        </button>
      )}

      {isOpen && typeof document !== "undefined" &&
        require("react-dom").createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
            <div className="glass-panel w-full max-w-lg bg-slate-900/80 backdrop-blur-2xl border-white/20 shadow-2xl relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden p-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-300 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-3xl md:text-4xl font-work-sans text-white drop-shadow-sm font-extrabold tracking-tight mb-8">
                {user.name}
              </h2>

              <div className="flex flex-col items-center flex-1 w-full">
                <img
                  className="rounded-full w-40 h-40 border-[3px] border-cyan-400/50 object-cover shadow-[0_0_20px_rgba(34,211,238,0.3)] mb-8"
                  src={user.pic}
                  alt={user.name}
                />
                <div className="text-xl md:text-2xl font-work-sans text-slate-200 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-inner">
                  <span className="font-bold text-white">Email:</span> {user.email}
                </div>
              </div>

              <div className="flex justify-end w-full mt-10">
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg border border-white/20 hover:scale-[1.02] active:scale-95"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ProfileModal;
