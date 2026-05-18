import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Film, User, Loader2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);

const POSTERS = [
  "/Anime_img/AOT.jpg",
  "/Anime_img/Bleach.jpg",
  "/Anime_img/Dark.jpg",
  "/Anime_img/DeathNote.jpg",
  "/Anime_img/Demon_slayer.png",
  "/Anime_img/Dragon_ball.jpg",
  "/Anime_img/GOT.jpg",
  "/Anime_img/HxH.jpg",
  "/Anime_img/JJK.jpg",
  "/Anime_img/Lost.jpg",
  "/Anime_img/Money_heist.jpg",
  "/Anime_img/OPM.jpg",
  "/Anime_img/One_Piece.jpg",
  "/Anime_img/Vinlandsaga.jpg",
  "/Anime_img/breaking_bad.jpg",
  "/Anime_img/naruto.jpg",
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const validate = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) toast.error(e.errors[0].message);
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/", { replace: true });
    } catch (error: any) {
      toast.error(
        error.message.includes("auth/invalid-credential")
          ? "Wrong email or password"
          : "Sign in failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, {
        displayName: displayName.trim() || email.split("@")[0],
      });
      toast.success("Welcome to AniTrace! 🎌");
      navigate("/", { replace: true });
    } catch (error: any) {
      toast.error(
        error.message.includes("auth/email-already-in-use")
          ? "Account already exists — sign in instead."
          : "Sign up failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/", { replace: true });
    } catch {
      toast.error("Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = mode === 'signin' ? handleSignIn : handleSignUp;

  return (
    <div className="flex min-h-screen w-full bg-[#09090b] text-white overflow-hidden relative font-sans items-center justify-center">
      
      {/* Smooth Animated Scrolling Background */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden flex flex-col gap-6 opacity-[0.38] select-none pointer-events-none justify-center items-center"
        style={{ 
          transform: "rotate(-12deg) scale(1.3) translate3d(0, 0, 0)",
          backfaceVisibility: "hidden"
        }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div 
            key={i}
            className="flex gap-6 min-w-max will-change-transform"
            style={{ transform: "translate3d(0, 0, 0)", backfaceVisibility: "hidden" }}
            animate={{ x: i % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
            transition={{ duration: 50 + i * 5, repeat: Infinity, ease: "linear" }}
          >
            {[...POSTERS, ...POSTERS].map((src, j) => (
              <img 
                key={j}
                src={src} 
                alt="Anime Poster" 
                className="w-32 h-48 md:w-48 md:h-72 object-cover rounded-xl shadow-2xl border border-white/5"
                style={{ transform: "translate3d(0, 0, 0)", backfaceVisibility: "hidden" }}
                loading="lazy"
              />
            ))}
          </motion.div>
        ))}
      </div>
      
      {/* Dynamic Glowing Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [0, 50, 0], y: [0, -50, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] top-[-100px] left-[-100px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2], x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] bottom-[-100px] right-[-100px] pointer-events-none z-0" 
      />

      {/* Dark Vignette Overlay to ensure form readability */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#09090b_95%)] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 py-12 h-screen md:h-auto overflow-y-auto hide-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-panel-heavy p-8 sm:p-10 rounded-3xl border border-white/10 shadow-[0_0_80px_-20px_rgba(217,70,239,0.15)] relative overflow-hidden"
        >
          {/* Decorative gradient border line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-blue-500" />
          
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-indigo-500/5 pointer-events-none" />

          <div className="flex flex-col items-center mb-8 relative z-10">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-indigo-600 rounded-2xl flex items-center justify-center p-0.5 shadow-xl shadow-fuchsia-500/20 mb-6"
            >
              <div className="w-full h-full bg-[#09090b]/90 backdrop-blur-sm rounded-[14px] flex items-center justify-center group-hover:bg-[#09090b]/70 transition-colors">
                <Film className="w-7 h-7 text-fuchsia-400 stroke-[1.5]" />
              </div>
            </motion.div>
            <motion.h1 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70"
            >
              Welcome to NEXA
            </motion.h1>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-zinc-400 text-sm text-center"
            >
              Track your favorite anime, series, and movies
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {mode === 'signup' && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="space-y-1"
              >
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Display Name</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300" />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-fuchsia-400 transition-colors z-10" />
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 focus:bg-black/60 transition-all z-10 relative"
                    required
                  />
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-1"
            >
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300" />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-fuchsia-400 transition-colors z-10" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 focus:bg-black/60 transition-all z-10 relative"
                  required
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-1"
            >
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                {mode === 'signin' && (
                  <a href="#" className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">Forgot?</a>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300" />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-fuchsia-400 transition-colors z-10" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 focus:bg-black/60 transition-all z-10 relative"
                  required
                />
              </div>
            </motion.div>

            <motion.button 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              type="submit"
              disabled={submitting}
              className="w-full relative overflow-hidden rounded-xl font-bold py-3.5 shadow-lg flex items-center justify-center gap-2 group mt-2"
            >
              {/* Sweeping gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-fuchsia-600 bg-[length:200%_auto] hover:bg-right transition-[background-position] duration-700 ease-in-out" />
              <div className="relative z-10 flex items-center gap-2 text-white">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                {!submitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />}
              </div>
            </motion.button>
          </form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex items-center gap-4 text-sm text-zinc-500 relative z-10"
          >
            <div className="h-px bg-white/10 flex-1" />
            <span>or continue with</span>
            <div className="h-px bg-white/10 flex-1" />
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 relative z-10"
          >
            <button 
              onClick={handleGoogle}
              type="button"
              disabled={submitting}
              className="w-full bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden relative group disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="relative z-10">Google</span>
            </button>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center text-xs text-zinc-500 relative z-10"
          >
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-bold text-fuchsia-400 hover:text-fuchsia-300"
            >
              {mode === 'signin' ? "Sign up" : "Sign in"}
            </button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
