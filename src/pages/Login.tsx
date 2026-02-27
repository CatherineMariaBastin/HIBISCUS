import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brain, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, name);
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Welcome to Hibiscus</h1>
          <p className="text-zinc-500 mt-2">Your personal AI-powered study companion.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Full Name</label>
              <input 
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe" 
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Email Address</label>
              <input 
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com" 
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
            >
              {isLoading ? "Signing in..." : "Get Started"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
