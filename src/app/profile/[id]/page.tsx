"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { AvatarDisplay } from "@/components/AvatarDisplay";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  MessageCircle, 
  Phone, 
  Video, 
  Shield, 
  Clock, 
  MapPin, 
  Calendar,
  User,
  Activity,
  Globe,
  Mail
} from "lucide-react";

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Offline";
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (diffMins < 1) return "Last seen just now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24 && date.getDate() === now.getDate()) return `Last seen today at ${timeStr}`;
  if (diffDays === 1 || (diffHours < 48 && date.getDate() === now.getDate() - 1)) return `Last seen yesterday at ${timeStr}`;
  
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Last seen ${dateStr} at ${timeStr}`;
}

function formatJoinDate(date: string | null): string {
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setIsOwnProfile(session.user.id === params.id);
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchData();

    const presenceChannel = supabase.channel("profile-presence").on("presence", { event: "sync" }, () => {
      const state = presenceChannel.presenceState();
      let online = false;
      Object.values(state).forEach((users: any) => {
        users.forEach((u: any) => {
          if (u.user_id === params.id) online = true;
        });
      });
      setIsOnline(online);
    }).subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030303]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Loading Profile</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030303] text-white">
        <div className="text-center space-y-6">
          <User className="w-16 h-16 mx-auto text-white/20" />
          <h1 className="text-2xl font-black uppercase">User Not Found</h1>
          <Button onClick={() => router.back()} className="bg-indigo-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-600/10 blur-[250px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-purple-600/5 blur-[250px] rounded-full" />
      </div>

      <header className="sticky top-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="text-white/50 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-xs font-black uppercase tracking-widest">Back</span>
          </Button>
          {isOwnProfile && (
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full">
              Your Profile
            </span>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="relative inline-block">
            <AvatarDisplay profile={profile} className="h-32 w-32 mx-auto border-4 border-indigo-500/30 shadow-2xl" />
            <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-[#030303] ${isOnline ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black italic uppercase tracking-tight">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-white/40 text-sm font-bold">@{profile.username}</p>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
            <Activity className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isOnline ? 'Online Now' : formatLastSeen(profile.last_seen)}
            </span>
          </div>

          {profile.bio && (
            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}
        </motion.div>

        {!isOwnProfile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 justify-center"
          >
            <Button 
              onClick={() => router.push(`/?chat=${profile.id}`)}
              className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button 
              variant="outline"
              className="border-white/10 h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button 
              variant="outline"
              className="border-white/10 h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5"
            >
              <Video className="w-4 h-4 mr-2" />
              Video
            </Button>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 px-2">Details</h2>
          
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
            <div className="p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Username</p>
                <p className="text-sm font-bold mt-1">@{profile.username}</p>
              </div>
            </div>

            {profile.full_name && (
              <div className="p-5 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Full Name</p>
                  <p className="text-sm font-bold mt-1">{profile.full_name}</p>
                </div>
              </div>
            )}

            <div className="p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Status</p>
                <p className={`text-sm font-bold mt-1 ${isOnline ? 'text-emerald-400' : 'text-white/60'}`}>
                  {isOnline ? 'Online' : formatLastSeen(profile.last_seen)}
                </p>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Joined</p>
                <p className="text-sm font-bold mt-1">{formatJoinDate(profile.created_at)}</p>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Encryption</p>
                <p className="text-sm font-bold mt-1 text-cyan-400">End-to-End Encrypted</p>
              </div>
            </div>
          </div>
        </motion.div>

        {isOwnProfile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4"
          >
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              Edit Profile in Settings
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
