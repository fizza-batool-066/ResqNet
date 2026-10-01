"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { Logo, ResourceIcon } from "./Shared";
import { LanguageSelector } from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export function Navbar() {
  const t = useT();
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: { key: string; target: string }[] = [
    { key: "nav.home", target: "hero" },
    { key: "nav.features", target: "features" },
    { key: "nav.howItWorks", target: "how" },
    { key: "nav.resources", target: "stats" },
    { key: "nav.about", target: "about" },
    { key: "nav.contact", target: "contact" },
  ];

  const handleNav = (target: string) => {
    setMobileOpen(false);
    setView("landing");
    setTimeout(() => {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled ? "glass-nav shadow-soft" : "bg-transparent"}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Logo />

        <ul className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <li key={l.key}>
              <button
                onClick={() => handleNav(l.target)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100/80 hover:text-slate-900 active:scale-95"
              >
                {t(l.key)}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSelector compact />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100 transition">
                  <Avatar className="size-8">
                    <AvatarFallback
                      style={{ background: user.avatarColor || "#1e6fdc" }}
                      className="text-white"
                    >
                      {user.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-slate-700 sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setView("dashboard")}>
                  {t("nav.dashboard")} <ChevronRight className="ml-auto size-4" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("history")}>
                  {t("nav.history")} <ChevronRight className="ml-auto size-4" />
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => setView("admin")}>
                    {t("nav.admin")} <ChevronRight className="ml-auto size-4" />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                  }}
                  className="text-red-600"
                >
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => setView("auth")}
              >
                {t("nav.login")}
              </Button>
              <Button
                size="sm"
                className="hidden bg-sky-600 hover:bg-sky-700 sm:inline-flex"
                onClick={() => setView("auth")}
              >
                {t("nav.getStarted")}
              </Button>
            </>
          )}
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden border-t border-slate-100 bg-white"
          >
            <ul className="flex flex-col gap-1 px-4 py-3">
              {links.map((l) => (
                <li key={l.key}>
                  <button
                    onClick={() => handleNav(l.target)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t(l.key)}
                  </button>
                </li>
              ))}
              {!user && (
                <li className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileOpen(false);
                      setView("auth");
                    }}
                  >
                    {t("nav.login")}
                  </Button>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

void ResourceIcon;
