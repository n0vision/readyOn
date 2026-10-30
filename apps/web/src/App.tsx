import { Routes, Route } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard.js";
import { Groups } from "./pages/Groups.js";
import { Friends } from "./pages/Friends.js";
import { Profile } from "./pages/Profile.js";
import { NavBar } from "./components/NavBar.js";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}
