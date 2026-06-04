"use client";

import { ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-16 md:pt-48 md:pb-32">
      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <Shield size={14} />
              Secured with Google OAuth
            </span>
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.03,
                    delayChildren: 0.3
                  }
                }
              }}
              className="mt-8 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.1]"
            >
              {"Never miss an internship or offer again.".split('').map((char, i) => {
                let className = '';
                if (i >= 14 && i < 25) {
                  className = 'text-emerald-600';
                } else if (i >= 28 && i < 34) {
                  className = 'bg-gradient-to-r from-emerald-500 to-teal-700 bg-clip-text text-transparent';
                }
                return (
                  <motion.span
                    key={i}
                    className={className}
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                  >
                    {char}
                  </motion.span>
                );
              })}
            </motion.h1>
            <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href="/dashboard?login=true" className="inline-flex items-center justify-center h-16 rounded-full px-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute top-0 -left-10 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-10 w-80 h-80 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-12 left-1/4 w-96 h-96 bg-green-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
    </section>
  );
}