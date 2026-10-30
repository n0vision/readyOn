import { useState, useEffect } from "react";
import {
  getCurrentTelegramId,
  fetchUserGroups,
  createGroup,
  joinGroup,
  updateGroupSettings,
} from "../services/api.js";

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
      await joinGroup(telegramId, inviteCode.trim());
      setInviteCode("");
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const copyInvite = (groupId: number, code: string) => {
    const link = `https://t.me/readyOnCS_bot?start=group_${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(groupId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareInvite = (code: string, name: string) => {
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
    try {
      await updateGroupSettings(groupId, { targetSize });
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReminderHour = async (groupId: number, reminderHour: number) => {
    try {
      await updateGroupSettings(groupId, { reminderHour });
      await loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold tracking-tight">👥 Группы</h1>

      {/* List */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--tg-theme-hint-color)]">
          Твои группы
        </h2>

        {loading ? (
          <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-center text-xs text-[var(--tg-theme-hint-color)]">
            Загрузка...
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map((g) => (
              <div
                key={g.id}
                className="p-3.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] space-y-3 border border-white/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <span>{g.name}</span>
                      {g.role === "OWNER" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-medium">
                          Владелец
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">
                      👥 {g.memberCount} участников
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => shareInvite(g.inviteCode, g.name)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--tg-theme-button-color)] text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <span>↗️</span>
                      <span>Инвайт</span>
                    </button>
                    <button
                      onClick={() => copyInvite(g.id, g.inviteCode)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Скопировать ссылку"
                    >
                      {copiedId === g.id ? "✓" : "📋"}
                    </button>
                  </div>
                </div>

                {/* Group settings */}
                <div className="pt-2 border-t border-white/5 space-y-2 text-xs">
                  {/* Target squad size */}
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--tg-theme-hint-color)]">🎯 Порог команды:</span>
                    <div className="flex items-center gap-1">
                      {[3, 4, 5].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleUpdateTargetSize(g.id, size)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            (g.targetSize || 5) === size
                              ? "bg-amber-500 text-black font-bold"
                              : "bg-white/5 hover:bg-white/10 text-white/70"
                          }`}
                        >
                          {size} чел
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reminder hour */}
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--tg-theme-hint-color)]">⏰ Вечерний опрос:</span>
                    <div className="flex items-center gap-1">
                      {[16, 17, 18, 19].map((hour) => (
                        <button
                          key={hour}
                          onClick={() => handleUpdateReminderHour(g.id, hour)}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            (g.reminderHour || 17) === hour
                              ? "bg-blue-500 text-white font-bold"
                              : "bg-white/5 hover:bg-white/10 text-white/70"
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
          <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-center text-xs text-[var(--tg-theme-hint-color)]">
            Пока нет групп. Создай или присоединись ниже!
          </div>
        )}
      </section>

      {/* Create form */}
      <section className="p-3.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] space-y-2.5 border border-white/5">
        <h3 className="text-xs font-semibold text-[var(--tg-theme-text-color)]">
          Создать новую группу
        </h3>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Название (например, CS Пацаны)"
            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-[var(--tg-theme-hint-color)] focus:outline-none focus:border-[var(--tg-theme-button-color)]"
          />
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--tg-theme-button-color)] text-white font-medium"
          >
            Создать
          </button>
        </form>
      </section>

      {/* Join form */}
      <section className="p-3.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] space-y-2.5 border border-white/5">
        <h3 className="text-xs font-semibold text-[var(--tg-theme-text-color)]">
          Присоединиться по коду инвайта
        </h3>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Код инвайта (например, 1td7xj28)"
            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-[var(--tg-theme-hint-color)] focus:outline-none focus:border-[var(--tg-theme-button-color)]"
          />
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Войти
          </button>
        </form>
      </section>
    </div>
  );
}
