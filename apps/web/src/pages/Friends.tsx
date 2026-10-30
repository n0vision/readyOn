import { useState, useEffect } from "react";
import { getCurrentTelegramId, fetchFriends } from "../services/api.js";
import { MemberCard } from "../components/MemberCard.js";

export function Friends() {
  const telegramId = getCurrentTelegramId();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends(telegramId)
      .then(setFriends)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [telegramId]);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold tracking-tight">👤 Друзья</h1>

      {loading ? (
        <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-center text-xs text-[var(--tg-theme-hint-color)]">
          Загрузка...
        </div>
      ) : friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map((friend) => (
            <MemberCard key={friend.id} member={friend} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-6 text-center text-[var(--tg-theme-hint-color)] space-y-2 border border-white/5">
          <p className="text-3xl">🤝</p>
          <p className="font-semibold text-sm text-[var(--tg-theme-text-color)]">
            Добавляйте друзей в группы
          </p>
          <p className="text-xs max-w-xs mx-auto">
            Все участники твоих групп отображаются на главном экране во вкладке «Статусы» в реальном времени!
          </p>
        </div>
      )}
    </div>
  );
}
