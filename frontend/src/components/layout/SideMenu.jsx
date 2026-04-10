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
    "group flex w-full items-center gap-3 rounded-2xl transition-all duration-300 backdrop-blur-2xl";
  const itemActive =
      isDarkTheme
      ? "bg-[#d9ff34] text-black shadow-[0_0_22px_rgba(217,255,52,0.22)]"
      : "bg-white/18 text-[#11131b] shadow-[0_14px_36px_rgba(15,23,42,0.12)] ring-1 ring-white/24 backdrop-blur-3xl backdrop-saturate-150";
  const itemIdle =
      isDarkTheme
      ? "text-[#7b8095] hover:bg-white/[0.06] hover:text-white hover:ring-1 hover:ring-white/10"
      : "text-[#5f6476] hover:bg-white/10 hover:text-[#11131b] hover:ring-1 hover:ring-white/18";

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
      <div className="mb-14 flex items-center justify-center lg:justify-center px-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-1.5 rounded-full ${isDarkTheme ? 'bg-[#d9ff34] shadow-[0_0_20px_rgba(217,255,52,0.55)]' : 'bg-[#11131b] shadow-[0_0_16px_rgba(17,19,27,0.18)]'}`} />
          <div className={`text-3xl font-black tracking-tighter ${isDarkTheme ? 'text-white' : 'text-[#11131b]'}`}>
            Smart<span className={isDarkTheme ? 'text-[#d9ff34]' : 'text-[#84cc16]'}>Spend</span>
          </div>
        </div>
      </div>

      <div className="mb-8 hidden lg:flex flex-col items-center gap-4 px-2 text-center">
        {user ? (
          <>
            <div className={`relative rounded-[28px] p-1 ${isDarkTheme ? 'border border-white/10 bg-white/[0.05] ring-1 ring-white/[0.06]' : 'border border-white/18 bg-white/16 ring-1 ring-white/24 backdrop-blur-3xl backdrop-saturate-150'}`}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="h-20 w-20 rounded-[24px] object-cover shadow-lg"
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
                {user?.email || tt('profile.defaultUser', 'Smart Spend user')}
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
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDarkTheme ? 'border border-white/10 bg-white/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.12)]' : 'border border-white/18 bg-white/16 shadow-[0_12px_30px_rgba(15,23,42,0.10)] backdrop-blur-3xl backdrop-saturate-150'}`}>
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
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isDarkTheme ? 'border border-white/10 bg-white/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.12)]' : 'border border-white/18 bg-white/16 shadow-[0_12px_30px_rgba(15,23,42,0.10)] backdrop-blur-3xl backdrop-saturate-150'}`}>
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
