import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Settings, User, Brain } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">Hibiscus</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/settings" className="text-zinc-500 hover:text-zinc-900 transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-3 pl-6 border-l border-zinc-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-zinc-900">{user.name}</p>
              <p className="text-xs text-zinc-500">{user.email}</p>
            </div>
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
              <User className="w-6 h-6" />
            </div>
            <button 
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
