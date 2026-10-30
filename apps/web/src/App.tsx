import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard.js";
import { Groups } from "./pages/Groups.js";
import { Profile } from "./pages/Profile.js";
import { NavBar } from "./components/NavBar.js";
import { initTelegramFullscreen } from "./utils/telegram.js";

export default function App() {
  useEffect(() => {
    initTelegramFullscreen();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#1E1F22] text-[#F2F3F5]">
      <main className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}
