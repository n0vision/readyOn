import { NavLink } from "react-router-dom";
import { Crosshair, Users, User } from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

const navItems = [
  { path: "/", label: "Сквад", icon: Crosshair },
  { path: "/groups", label: "Группа", icon: Users },
  { path: "/profile", label: "Профиль", icon: User },
];

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b0e14]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => triggerHaptic("selection")}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[11px] font-bold tracking-wider transition-all duration-200 relative py-1 px-4 min-w-[72px] cursor-pointer active:scale-95 ${
                  isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive
                        ? "text-[#00f076] drop-shadow-[0_0_10px_rgba(0,240,118,0.7)] scale-110"
                        : "text-white/50"
                    }`}
                  />
                  <span className={isActive ? "text-white font-extrabold" : ""}>{item.label}</span>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f076] shadow-[0_0_8px_rgba(0,240,118,0.9)] animate-pulse"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 opacity-0"></span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
