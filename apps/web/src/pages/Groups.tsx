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
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">
      {/* Page Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2B2D31] border border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#8BA4CC]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
              Группы
            </h1>
            <p className="text-[10px] text-[#949BA4] font-medium tracking-wider uppercase mt-0.5">
              Управление сквадами
            </p>
          </div>
        </div>
      </div>

      {/* Section: Твои группы */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-[#949BA4] px-1 uppercase tracking-wider">
          Твои группы
        </h2>

        {loading ? (
          <div className="bg-[#2B2D31] border border-white/5 p-6 rounded-2xl text-center text-xs text-[#949BA4] animate-pulse">
            Загрузка групп...
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((g) => (
              <div
                key={g.id}
                className="bg-[#2B2D31] border border-white/5 rounded-2xl p-4 space-y-3.5 shadow-sm"
              >
                {/* Group Top Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{g.name}</span>
                      {g.role === "OWNER" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#3F5F96]/20 text-[#8BA4CC] font-semibold border border-[#3F5F96]/40">
                          Владелец
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#949BA4] mt-1 flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-[#949BA4]" />
                      <span>{g.memberCount} участников</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => shareInvite(g.inviteCode, g.name)}
                      className="px-3 py-1.5 rounded-xl bg-[#3F5F96] hover:bg-[#4D72B0] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Инвайт</span>
                    </button>
                    <button
                      onClick={() => copyInvite(g.id, g.inviteCode)}
                      className="p-2 rounded-xl bg-[#1E1F22] hover:bg-[#323336] text-[#DBDEE1]/70 border border-white/5 transition-all cursor-pointer"
                      title="Скопировать ссылку"
                    >
                      {copiedId === g.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Group Settings Inside Card (Enlarged for mobile comfort: h-11, 44px) */}
                <div className="pt-3.5 border-t border-white/5 space-y-3.5">
                  {/* Squad Target Size */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#949BA4] flex items-center gap-1.5 font-medium">
                        <Target className="w-4 h-4 text-[#8BA4CC]" />
                        <span>Порог команды:</span>
                      </span>
                      <span className="text-[11px] text-[#8BA4CC] font-semibold">
                        {g.targetSize || 5} игроков для сбора
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-[#1E1F22] p-1.5 rounded-xl border border-white/5">
                      {[3, 4, 5].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleUpdateTargetSize(g.id, size)}
                          className={`h-11 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                            (g.targetSize || 5) === size
                              ? "bg-[#3F5F96] text-white shadow-xs"
                              : "text-[#DBDEE1]/70 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {size} чел
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Evening Reminder Hour */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#949BA4] flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-[#8BA4CC]" />
                        <span>Вечерний опрос:</span>
                      </span>
                      <span className="text-[11px] text-[#8BA4CC] font-semibold">
                        В {g.reminderHour || 18}:00 каждый день
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 bg-[#1E1F22] p-1.5 rounded-xl border border-white/5">
                      {[16, 17, 18, 19].map((hour) => (
                        <button
                          key={hour}
                          onClick={() => handleUpdateReminderHour(g.id, hour)}
                          className={`h-11 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                            (g.reminderHour || 18) === hour
                              ? "bg-[#3F5F96] text-white shadow-xs"
                              : "text-[#DBDEE1]/70 hover:text-white hover:bg-white/5"
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
          <div className="bg-[#2B2D31] border border-white/5 p-6 rounded-2xl text-center text-xs text-[#949BA4]">
            Пока нет групп. Создай или присоединись ниже!
          </div>
        )}
      </section>

      {/* Section: Создать группу */}
      <section className="bg-[#2B2D31] border border-white/5 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[#8BA4CC]" />
          <span>Создать новую группу</span>
        </h3>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Название (например, CS Пацаны)"
            className="flex-1 bg-[#1E1F22] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#949BA4]/50 focus:outline-none focus:border-[#3F5F96] transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#3F5F96] hover:bg-[#4D72B0] text-white text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            Создать
          </button>
        </form>
      </section>

      {/* Section: Присоединиться по инвайту */}
      <section className="bg-[#2B2D31] border border-white/5 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <LogIn className="w-3.5 h-3.5 text-[#8BA4CC]" />
          <span>Вступить по коду инвайта</span>
        </h3>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Код инвайта (например, 1td7xj28)"
            className="flex-1 bg-[#1E1F22] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-[#949BA4]/50 focus:outline-none focus:border-[#3F5F96] transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#323336] hover:bg-white/10 text-white text-xs font-bold border border-white/5 shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            Войти
          </button>
        </form>
      </section>
    </div>
  );
}
