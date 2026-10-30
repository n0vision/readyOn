import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Squad", icon: "⊞" },
  { path: "/groups", label: "Group", icon: "👥" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c1018]/95 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-bold tracking-wider transition-all duration-200 relative py-1 ${
                isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`text-lg leading-none ${
                    isActive ? "text-[#00f076] drop-shadow-[0_0_8px_rgba(0,240,118,0.6)]" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f076] shadow-[0_0_8px_rgba(0,240,118,0.9)]"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
