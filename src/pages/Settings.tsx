import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, Bell, Moon, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-zinc-500">Manage your account and preferences.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-emerald-600 font-bold rounded-xl shadow-sm border border-emerald-100">
            <User className="w-5 h-5" />
            Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors">
            <Shield className="w-5 h-5" />
            Privacy
          </button>
        </aside>

        <div className="md:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold border-b border-zinc-100 pb-4">Personal Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Full Name</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-600">
                  <User className="w-4 h-4" />
                  {user.name}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-600">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold border-b border-zinc-100 pb-4">Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Study Reminders</p>
                    <p className="text-sm text-zinc-500">Get notified when it's time to review.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Dark Mode</p>
                    <p className="text-sm text-zinc-500">Easier on the eyes for night study.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
