import React, { useContext, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/UserContext";
import CharAvatar from "../Cards/CharAvatar";
import useT from "../../hooks/useT";
import { LuLogOut, LuRefreshCcw, LuPiggyBank } from "react-icons/lu";

export default function SideMenu() {
  const { user, clearUser, prefs } = useContext(UserContext);
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();

  const isDarkTheme = prefs?.theme === "dark";
  const containerClass = "flex min-h-full flex-col px-3 py-5 lg:px-4 lg:py-6";
  const itemBase =
    "group flex w-full items-center gap-3 rounded-2xl transition-all duration-200";
  const itemActive =
    isDarkTheme
      ? "bg-[#d9ff34] text-black shadow-[0_0_18px_rgba(217,255,52,0.2)]"
      : "bg-[#11131b] text-[#d9ff34] shadow-[0_10px_22px_rgba(15,23,42,0.08)]";
  const itemIdle =
    isDarkTheme
      ? "text-[#7b8095] hover:bg-white/[0.04] hover:text-white"
      : "text-[#5f6476] hover:bg-black/[0.03] hover:text-[#11131b]";

  const pathToI18nKey = (path) => {
    switch (path) {
      case "/dashboard": return "menu.dashboard";
      case "/income": return "menu.income";
      case "/expense": return "menu.expense";
      case "/settings": return "menu.settings";
      case "/recurring": return "menu.recurring";
      case "/profile": return "menu.profile";
      case "/savings": return "menu.savings";
      case "logout": return "menu.logout";
      default: return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    clearUser?.();
    navigate("/login");
  };

  const menuItems = useMemo(() => {
    const base = Array.isArray(SIDE_MENU_DATA) ? [...SIDE_MENU_DATA] : [];

    const hasRecurring = base.some((i) => i?.path === "/recurring");
    if (!hasRecurring) {
      base.splice(1, 0, {
        path: "/recurring",
        label: "Recurring",
        i18nKey: "menu.recurring",
        icon: LuRefreshCcw,
      });
    }

    const hasSavings = base.some((i) => i?.path === "/savings");
    if (!hasSavings) {
      base.splice(2, 0, {
        path: "/savings",
        label: "Savings",
        i18nKey: "menu.savings",
        icon: LuPiggyBank,
      });
    }

    return base;
  }, []);

  const getLabel = (item) => {
    const key = item.i18nKey || pathToI18nKey(item.path);
    if (key) {
      const translated = t(key);
      if (!translated || translated === key || translated.includes(".")) {
        return item.label ?? "Recurring";
      }
      return translated;
    }
    return item.label ?? "Recurring";
  };

  const photoUrl = user?.profilePhoto || null;

  return (
    <div className={containerClass}>
      <div className="mb-6 flex items-center justify-center lg:justify-start">
        <div className={`rounded-2xl px-3 py-2 text-2xl font-black tracking-tight ${isDarkTheme ? 'bg-white/[0.03] text-[#d9ff34]' : 'bg-white text-[#11131b] shadow-sm'}`}>
          SS
        </div>
      </div>

      <div className="mb-8 hidden lg:flex flex-col items-start gap-4 px-2">
        {user ? (
          <>
            <div className={`relative rounded-[28px] p-1 ${isDarkTheme ? 'border border-white/10 bg-white/[0.03]' : 'border border-black/5 bg-white shadow-sm'}`}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="h-20 w-20 rounded-[24px] object-cover"
                />
              ) : (
                <CharAvatar
                  fullName={user?.fullName}
                  width="w-20"
                  height="h-20"
                  style="text-xl font-bold"
                />
              )}
            </div>
            <div>
              <h5 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-[#11131b]'}`}>
                {user?.username || user?.fullName || ""}
              </h5>
              <p className={`mt-1 text-sm ${isDarkTheme ? 'text-[#7b8095]' : 'text-[#6b7280]'}`}>
                {user?.email || "Smart Spend user"}
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className={`h-20 w-20 rounded-[24px] ${isDarkTheme ? 'bg-white/5' : 'bg-black/5'}`} />
            <div className={`h-4 w-24 rounded ${isDarkTheme ? 'bg-white/5' : 'bg-black/5'}`} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        {menuItems.map((item, idx) => {
          const labelText = getLabel(item);
          const Icon = item.icon;

          if (item.path === "/logout") {
            return (
              <button
                key={`menu_${idx}`}
                onClick={handleLogout}
                className={`${itemBase} ${itemIdle} mt-auto px-3 py-3 text-left lg:px-4`}
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDarkTheme ? 'border border-white/8 bg-white/[0.02]' : 'border border-black/5 bg-white'}`}>
                  <LuLogOut className="text-xl" />
                </span>
                <span className="hidden lg:block text-sm font-semibold">{labelText}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={`menu_${idx}`}
              to={item.path}
              end
              onClick={(e) => {
                if (location.pathname === item.path) {
                  e.preventDefault();
                }
              }}
              className={({ isActive }) =>
                `${itemBase} ${isActive ? itemActive : itemIdle} px-3 py-3 lg:px-4`
              }
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isDarkTheme ? 'border border-white/8 bg-white/[0.02]' : 'border border-black/5 bg-white'}`}>
                {Icon ? <Icon className="text-xl" /> : null}
              </span>
              <span className="hidden lg:block text-sm font-semibold">{labelText}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
