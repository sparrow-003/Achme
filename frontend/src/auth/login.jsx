import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import "../Styles/tailwind.css";
import logoImage from "../images/logo.png";
import backheadImage from "../images/backhead.png";

const API_BACKEND = "http://localhost:5000";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!email.trim()) {
      setError("Please enter email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_BACKEND}/api/auth/send-email-otp`, { email: email.trim().toLowerCase() });
      alert("OTP sent to your email");
    } catch (err) {
      try {
        await axios.post("/api/auth/send-email-otp", { email: email.trim().toLowerCase() });
        alert("OTP sent to your email");
      } catch (err2) {
        setError(err2.response?.data?.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BACKEND}/api/auth/login`, {
        email: email.trim().toLowerCase(),
        otp,
      });
      login({ ...res.data.user, token: res.data.token });
      navigate("/dashboard");
    } catch (err) {
      try {
        const res = await axios.post("/api/auth/login", {
          email: email.trim().toLowerCase(),
          otp,
        });
        login({ ...res.data.user, token: res.data.token });
        navigate("/dashboard");
      } catch (err2) {
        const msg = err2.response?.data?.message || "Login failed";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-end relative overflow-hidden pr-8 lg:pr-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={backheadImage} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={logoImage} alt="Logo" className="h-16 w-auto object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white text-center">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-center mt-2">
            Sign in to your account to continue
          </p>

          {/* Form */}
          <div className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={sendOtp}
                disabled={loading}
                className="flex-1 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition disabled:opacity-50 cursor-pointer"
              >
                Get OTP
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-slate-400 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Register here
            </Link>
          </p>

          {/* Admin Login Link */}
          <p className="text-center text-slate-500 mt-4 text-sm">
            Are you an admin?{" "}
            <Link to="/login/admin" className="text-blue-400 hover:text-blue-300">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}