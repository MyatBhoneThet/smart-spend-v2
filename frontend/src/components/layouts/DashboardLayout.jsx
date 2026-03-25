import React, { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import SideMenu from "./SideMenu";
import ChatWidget from "../Chat/ChatWidget";
import { LuMenu } from "react-icons/lu";

export default function DashboardLayout({ children, activeMenu }) {
  const { user, prefs } = useContext(UserContext) || {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const desktopSidebarRef = useRef(null);
  const mobileSidebarRef = useRef(null);
  const mainRef = useRef(null);

  const appTheme = prefs?.theme || "light";

  // Rely less on solid background colors as index.css handles body styling
  const bgColor = appTheme === "dark" ? "text-gray-100" : "text-gray-900";

  const sideBg =
    appTheme === "dark"
      ? "bg-[#0f1119] border-white/8"
      : "bg-[#f8f5ec] border-black/5 shadow-[4px_0_24px_rgba(15,23,42,0.06)]";

  // Get current path
  const location = useLocation();
  const path = location.pathname.split("/").filter(Boolean).pop() || "dashboard";

  // Map path to friendly display names
  const pageNameMap = {
    dashboard: "Dashboard",
    recurring: "Recurring",
    settings: "Settings",
    savings: "Savings",
    expense: "Expense",
    income: "Income",
    profile: "Profile",
  };

  const pageTitle = pageNameMap[path.toLowerCase()] || "Dashboard";
  const sidebarScrollKey = "dashboard-sidebar-scroll";
  const mainScrollKey = `dashboard-main-scroll:${location.pathname}`;

  useEffect(() => {
    const restoreScroll = (ref, key) => {
      const saved = sessionStorage.getItem(key);
      if (!ref.current || saved == null) return;
      ref.current.scrollTop = Number(saved) || 0;
    };

    requestAnimationFrame(() => {
      restoreScroll(desktopSidebarRef, sidebarScrollKey);
      restoreScroll(mobileSidebarRef, sidebarScrollKey);
      restoreScroll(mainRef, mainScrollKey);
    });
  }, [location.pathname, isMenuOpen]);

  const saveSidebarScroll = (event) => {
    sessionStorage.setItem(sidebarScrollKey, String(event.currentTarget.scrollTop));
  };

  const saveMainScroll = (event) => {
    sessionStorage.setItem(mainScrollKey, String(event.currentTarget.scrollTop));
  };

  return (
    <div className={`min-h-screen flex flex-col ${bgColor}`}>
      {/* Top bar (mobile only) */}
      <div
        className={`md:hidden flex items-center justify-between px-4 py-3 border-b backdrop-blur-md ${
          appTheme === "dark" ? "border-white/10 bg-black/40" : "border-gray-200/50 bg-white/60"
        }`}
      >
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <LuMenu size={22} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">{pageTitle}</h1>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar (desktop) */}
        <aside
          ref={desktopSidebarRef}
          onScroll={saveSidebarScroll}
          className={`hidden md:block w-[96px] lg:w-[280px] shrink-0 overflow-y-auto z-10
            scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent
            border-r transition-all duration-300 ${sideBg}`}
          style={{ height: "100vh" }}
        >
          <SideMenu activeMenu={activeMenu} />
        </aside>

        {/* Mobile sidebar (drawer) */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div
              ref={mobileSidebarRef}
              onScroll={saveSidebarScroll}
              className={`w-[260px] h-full ${sideBg} overflow-y-auto scrollbar-thin p-0 border-r animate-fade-in-up`}
              style={{ animationDuration: '0.3s' }}
            >
              <SideMenu activeMenu={activeMenu} />
            </div>
            <div
              className="flex-1 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            />
          </div>
        )}

        {/* Main content */}
        <main
          ref={mainRef}
          onScroll={saveMainScroll}
          className="flex-1 p-4 md:p-8 overflow-y-auto relative z-0"
          style={{ height: "100vh" }}
        >
          {/* subtle background flare for aesthetic */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[120px] rounded-full pointer-events-none -z-10 ${
            appTheme === "dark" ? "bg-green-500/10" : "bg-lime-200/60"
          }`}></div>
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Floating Chat Widget */}
      {user && <ChatWidget side="right" />}
    </div>
  );
}
