"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 md:px-10">

        {/* Left Side: Brand Logo and Title */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="rounded-xl bg-emerald-600 p-2 text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
            <Mail size={18} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
            Find My Mail
          </span>
        </Link>

        {/* Right Side is now completely empty to avoid duplicate clutter */}
        <div className="flex items-center gap-4"></div>
      </div>
    </nav>
  );
}