import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Статусы", icon: "🎮" },
  { path: "/groups", label: "Группы", icon: "👥" },
  { path: "/friends", label: "Друзья", icon: "👤" },
  { path: "/profile", label: "Профиль", icon: "⚙️" },
];

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-secondary-bg-color)] border-t border-white/10">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs transition-colors ${
                isActive
                  ? "text-[var(--tg-theme-button-color)]"
                  : "text-[var(--tg-theme-hint-color)]"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
