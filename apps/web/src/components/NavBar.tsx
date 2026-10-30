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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E1F22] border-t border-white/5 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => triggerHaptic("selection")}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-wide transition-all duration-150 py-1 px-4 min-w-[72px] cursor-pointer active:scale-95 ${
                  isActive
                    ? "text-[#8BA4CC] font-bold"
                    : "text-[#949BA4] hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-all duration-150 ${
                      isActive ? "text-[#8BA4CC]" : "text-[#949BA4]"
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
