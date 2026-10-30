import { useState, useEffect } from "react";
import { getCurrentTelegramId, fetchUserGroups, createGroup, joinGroup } from "../services/api.js";

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
                className="p-3.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-between border border-white/5"
              >
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

                <button
                  onClick={() => copyInvite(g.id, g.inviteCode)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--tg-theme-button-color)] text-white hover:opacity-90 transition-opacity"
                >
                  {copiedId === g.id ? "✓ Скопировано" : "Инвайт"}
                </button>
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
