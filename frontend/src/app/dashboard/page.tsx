"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  ExternalLink,
  LogOut,
  Zap,
  Calendar,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: any;
  }
}

const formatReceivedAt = (receivedAt: any) => {
  if (!receivedAt) return "";
  const num = Number(receivedAt);
  if (!isNaN(num) && num > 0) {
    if (num < 10000000000) {
      return new Date(num * 1000).toLocaleDateString();
    }
    return new Date(num).toLocaleDateString();
  }
  return new Date(receivedAt).toLocaleDateString();
};

export default function DashboardPage() {
  const [isSynced, setIsSynced] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const API_BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.oauth2) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setSdkReady(true);
    };
    document.head.appendChild(script);
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/emails/important`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEmails(data || []);
    } catch (error) {
      console.error("Background fetch logged:", error);
    } finally {
      setLoading(false);
    }
  };

  const startScan = async (token?: string) => {
    const currentToken = token || accessToken;

    if (!currentToken) {
      handleLogin();
      return;
    }

    setIsSynced(true);
    setLoading(true);
    try {
      toast.info("Deep scanning all folders (including Spam) for matches...");
      const res = await fetch(`${API_BASE_URL}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: currentToken })
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(errorBody || "Scan dropped by server.");
      }

      const result = await res.json();
      toast.success("Scan complete! Found your updates.");

      if (result.important_emails) {
        setEmails(result.important_emails);
      } else {
        fetchEmails();
      }
    } catch (error) {
      console.error(error);
      toast.error("Scan processing failed. Please check backend filters.");
      setIsSynced(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!window.google?.accounts?.oauth2) {
      toast.error("Google service initializing. Try again in a second!");
      return;
    }

    const clientId = "393502991346-fo62tnoq5i6htbrie8j25b6jsiplgibu.apps.googleusercontent.com";

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/gmail.readonly",
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            startScan(response.access_token);
          } else if (response.error) {
            toast.error(`Authentication rejected: ${response.error}`);
          }
        },
      });
      client.requestAccessToken();
    } catch (error) {
      console.error(error);
      toast.error("Failed to open the Google prompt.");
    }
  };

  const handleSignOut = () => {
    if (accessToken && window.google) {
      try { window.google.accounts.oauth2.revoke(accessToken, () => { }); } catch (e) { }
    }
    setAccessToken(null);
    setIsSynced(false);
    setEmails([]);
    toast.success("Disconnected.");
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  // Shows ALL read/unread career matches fetched from the backend filters
  const filteredEmails = emails.filter((email: any) => {
    return !!email.opportunity;
  });

  return (
    <div className="flex min-h-screen bg-slate-50/50 pt-6">
      {/* SIDEBAR NAVIGATION CONTROL PANEL */}
      <aside className="fixed left-0 hidden h-[calc(100vh-24px)] w-64 border-r bg-white p-6 lg:block">
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Overview</h2>
            <nav className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl py-6 bg-emerald-50 text-[#00965e] font-semibold shadow-sm hover:bg-emerald-50 hover:text-[#00965e]">
                <Mail className="h-5 w-5" />
                Opportunities
                {filteredEmails.length > 0 && (
                  <Badge className="ml-auto bg-[#e6f5ef] text-[#00965e] border-none font-bold">{filteredEmails.length}</Badge>
                )}
              </Button>
            </nav>
          </div>
          <div className="pt-4">
            <h2 className="mb-4 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Settings</h2>
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl py-6 text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
              Disconnect Inbox
            </Button>
          </div>
        </div>
      </aside>

      {/* COMPONENT STREAM INTERFACE */}
      <main className="flex-1 lg:ml-64">
        <div className="container mx-auto max-w-5xl p-6 md:p-10">
          <header className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">Dashboard</h1>
              <p className="mt-1 text-base font-medium text-slate-500">Displaying job selections, internships, and important offer forms.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="rounded-full bg-[#00965e] px-8 py-6 font-bold text-white shadow-xl shadow-[#00965e]/20 hover:bg-[#008050]" onClick={() => startScan()} disabled={loading}>
                {loading ? <Zap className="h-4 w-4 animate-spin" /> : (isSynced ? "Refresh Scan" : "Connect & Scan")}
              </Button>
            </div>
          </header>

          {!isSynced && filteredEmails.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-[2.5rem] bg-white border border-slate-100 p-16 text-center shadow-sm">
              <div className="mb-8 rounded-3xl bg-emerald-50 p-8 text-[#00965e]">
                <Mail size={64} strokeWidth={1} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">Find Your Selection Mails</h2>
              <p className="mt-4 max-w-md text-lg text-slate-500">Connect to extract hidden internship letters or mandatory forms from your inbox and spam folders.</p>
              <Button size="lg" className="mt-10 rounded-full px-12 py-7 text-lg font-bold bg-[#00965e] hover:bg-[#008050]" onClick={() => startScan()}>
                Connect & Scan
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {loading && filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100">
                  <Zap className="mb-6 h-16 w-16 text-emerald-200 animate-pulse" />
                  <p className="text-xl font-bold text-slate-400">Scrubbing all folders for offers...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100">
                  <Inbox className="mb-6 h-16 w-16 text-slate-200" />
                  <p className="text-xl font-bold text-slate-400">No matching selection or internship emails found.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredEmails.map((email: any, i: number) => (
                    <Card key={email.gmail_id || i} className="group overflow-hidden rounded-[2rem] border-slate-100 bg-white shadow-sm hover:shadow-md transition-all hover:border-emerald-200">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className={`w-3 ${email.opportunity?.opportunity_type === 'Interview' ? 'bg-[#00965e]' : 'bg-teal-500'}`} />
                          <div className="flex-1 p-8">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100 font-bold px-3 border-none shadow-none">
                                    📁 {email.folder || "INBOX"}
                                  </Badge>
                                  {email.opportunity && (
                                    <Badge className="rounded-full bg-[#e6f5ef] text-[#00965e] border-none font-bold hover:bg-[#e6f5ef]">
                                      {email.opportunity.opportunity_type}
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#00965e] transition-colors">{email.subject}</h3>
                                <p className="text-sm font-semibold text-slate-500">{email.sender}</p>
                              </div>
                              <div className="text-right text-sm font-bold text-slate-400 whitespace-nowrap">
                                {formatReceivedAt(email.received_at)}
                              </div>
                            </div>
                            <p className="mt-4 text-slate-600 line-clamp-2 text-sm leading-relaxed">{email.snippet}</p>
                            <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-50">
                              {email.opportunity?.deadline && (
                                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-[#00965e]">
                                  <Calendar size={16} />
                                  <span className="text-sm font-bold">
                                    Deadline: {new Date(email.opportunity.deadline).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <Button
                                variant="secondary"
                                className="ml-auto rounded-full bg-slate-900 text-white hover:bg-[#00965e] font-bold px-6 h-10 text-xs transition-all"
                                onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${email.gmail_id}`, '_blank')}
                              >
                                View Email
                                <ExternalLink className="ml-2 h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}