import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { BrandLogo } from '../../components/ui/BrandLogo.js';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Utensils,
  Zap,
  Users,
  Smile,
  Heart,
  AlertCircle,
} from 'lucide-react';
import biryaniImg from '../../assets/food/biryani.jpg';
import parottaImg from '../../assets/food/parotta.jpg';

export const LoginPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Retrieve destination if redirected from push notification or protected route
  const redirectTarget =
    (location.state as any)?.from?.pathname ||
    searchParams.get('redirect') ||
    null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = employeeId.trim().toUpperCase();
    if (!trimmedId || !password) {
      setErrorMessage('Please enter your Employee ID and password.');
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await login(trimmedId, password);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        // If targeted to a specific poll or route, go there directly
        const destination = redirectTarget || '/dashboard';
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Invalid Employee ID or password. Please verify with your administrator.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#F4F7FB] relative overflow-hidden select-none font-sans">
      {/* Soft Ambient Background Gradients matching Reference UI */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[550px] h-[550px] bg-indigo-100/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glassmorphic Container matching Reference (Top-Left Screen) */}
      <div className="relative z-10 w-full max-w-5xl bg-white/90 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col lg:flex-row items-stretch">
        
        {/* LEFT COLUMN: Visual Brand & Value Proposition Area */}
        <div className="w-full lg:w-[54%] p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative bg-gradient-to-br from-slate-50/80 via-blue-50/30 to-indigo-50/20 border-b lg:border-b-0 lg:border-r border-slate-200/80">
          <div>
            {/* Top Brand Logo */}
            <div className="mb-10 flex items-center justify-between">
              <BrandLogo size="md" showText linkTo="/login" />
            </div>

            {/* Sub-label & Main Heading */}
            <div className="space-y-3 mb-8">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-mono block">
                POLLHUB —
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight font-display leading-[1.15]">
                Good Food Brings Great <span className="text-blue-600">People Together</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-md pt-1">
                Vote for today's lunch and make the workplace a happier place.
              </p>
            </div>

            {/* 3 Value Pillars with Circular Icons matching Reference */}
            <div className="space-y-4 max-w-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Fresh & Varied Options</h2>
                  <p className="text-[11px] text-slate-500">New authentic dishes prepared every day</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Quick & Easy</h2>
                  <p className="text-[11px] text-slate-500">Vote in seconds right from your desk or phone</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">A Happier Workplace</h2>
                  <p className="text-[11px] text-slate-500">Good food, better days, united team</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Quote Doodle & Food Photography Peeks */}
          <div className="pt-8 mt-6 border-t border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold italic">
              <span>Better Food, Brighter Days</span>
              <Smile className="w-4 h-4 text-amber-500" />
            </div>

            <div className="flex -space-x-3 items-center">
              <img
                src={biryaniImg}
                alt="Biryani"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
              />
              <img
                src={parottaImg}
                alt="Parotta"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Floating Login Card matching Reference */}
        <div className="w-full lg:w-[46%] p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Sign in to your PollHub account
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">
                  Employee ID
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter your employee ID"
                    autoComplete="username"
                    autoFocus
                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-10 py-2.5 transition-all duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep signed in & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Keep me signed in</span>
                </label>

                <button
                  type="button"
                  onClick={() => alert('Please reach out to your Colan system administrator to reset your password.')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Submit Button matching Reference */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card Footer Quote matching Reference */}
          <div className="pt-8 mt-6 border-t border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1.5">
              <span>Good Food, Good People, Same Team</span>
              <Heart className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
