import { useState, useEffect } from "react";
import {
  getCurrentTelegramId,
  fetchUserGroups,
  createGroup,
  joinGroup,
  updateGroupSettings,
} from "../services/api.js";
import { Users, Share2, Copy, Check, Target, Clock, Plus, LogIn } from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

export function Groups() {
  const telegramId = getCurrentTelegramId();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await fetchUserGroups(telegramId);
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      triggerHaptic("success");
      await createGroup(telegramId, newGroupName.trim());
      setNewGroupName("");
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    try {
      triggerHaptic("success");
      await joinGroup(telegramId, inviteCode.trim());
      setInviteCode("");
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const copyInvite = (groupId: number, code: string) => {
    triggerHaptic("selection");
    const link = `https://t.me/readyOnCS_bot?start=group_${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(groupId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareInvite = (code: string, name: string) => {
    triggerHaptic("selection");
    const inviteUrl = `https://t.me/readyOnCS_bot?start=group_${code}`;
    const text = `Го в CS2! Заходи в группу «${name}» в readyOn:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  const handleUpdateTargetSize = async (groupId: number, targetSize: number) => {
    triggerHaptic("selection");
    try {
      await updateGroupSettings(groupId, { targetSize });
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReminderHour = async (groupId: number, reminderHour: number) => {
    triggerHaptic("selection");
    try {
      await updateGroupSettings(groupId, { reminderHour });
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-36">
      <h1 className="font-hud text-xl font-bold tracking-tight flex items-center gap-2">
        <Users className="w-5 h-5 text-[#00f076]" />
        <span>Группы</span>
      </h1>

      {/* List */}
      <section className="space-y-2.5">
        <h2 className="font-hud text-xs font-semibold uppercase tracking-wider text-[var(--tg-theme-hint-color)]">
          Твои группы
        </h2>

        {loading ? (
          <div className="hud-card p-6 rounded-2xl text-center text-xs text-white/40 animate-pulse font-hud">
            Загрузка групп...
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((g) => (
              <div
                key={g.id}
                className="hud-card p-4 rounded-2xl space-y-3 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-hud font-bold text-sm text-white flex items-center gap-2">
                      <span>{g.name}</span>
                      {g.role === "OWNER" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                          Владелец
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50 mt-0.5 flex items-center gap-1.5 font-hud">
                      <Users className="w-3.5 h-3.5 text-white/40" />
                      <span>{g.memberCount} участников</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => shareInvite(g.inviteCode, g.name)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-[#00f076] text-black font-hud font-bold hover:bg-[#00f076]/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Инвайт</span>
                    </button>
                    <button
                      onClick={() => copyInvite(g.id, g.inviteCode)}
                      className="text-xs p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Скопировать ссылку"
                    >
                      {copiedId === g.id ? (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/70" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Group settings */}
                <div className="pt-3 border-t border-white/10 space-y-2.5 text-xs">
                  {/* Target squad size */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 flex items-center gap-1.5 font-hud text-[11px]">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      <span>Порог команды:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[3, 4, 5].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleUpdateTargetSize(g.id, size)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-hud font-bold transition-all cursor-pointer ${
                            (g.targetSize || 5) === size
                              ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                              : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                          }`}
                        >
                          {size} чел
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reminder hour */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 flex items-center gap-1.5 font-hud text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Вечерний опрос:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[16, 17, 18, 19].map((hour) => (
                        <button
                          key={hour}
                          onClick={() => handleUpdateReminderHour(g.id, hour)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-hud font-bold transition-all cursor-pointer ${
                            (g.reminderHour || 17) === hour
                              ? "bg-[#38bdf8] text-black shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                              : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                          }`}
                        >
                          {hour}:00
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hud-card p-6 rounded-2xl text-center text-xs text-white/50 font-hud">
            Пока нет групп. Создай или присоединись ниже!
          </div>
        )}
      </section>

      {/* Create form */}
      <section className="hud-card p-4 rounded-2xl space-y-3 border border-white/10">
        <h3 className="font-hud text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[#00f076]" />
          <span>Создать новую группу</span>
        </h3>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Название (например, CS Пацаны)"
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00f076]/50 transition-colors"
          />
          <button
            type="submit"
            className="text-xs px-4 py-2 rounded-xl bg-[#00f076] text-black font-hud font-black hover:bg-[#00f076]/90 active:scale-95 transition-all cursor-pointer"
          >
            Создать
          </button>
        </form>
      </section>

      {/* Join form */}
      <section className="hud-card p-4 rounded-2xl space-y-3 border border-white/10">
        <h3 className="font-hud text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
          <LogIn className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Присоединиться по коду инвайта</span>
        </h3>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Код инвайта (например, 1td7xj28)"
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#38bdf8]/50 transition-colors font-mono"
          />
          <button
            type="submit"
            className="text-xs px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-hud font-bold active:scale-95 transition-all cursor-pointer border border-white/10"
          >
            Войти
          </button>
        </form>
      </section>
    </div>
  );
}
