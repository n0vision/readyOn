export function Friends() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">👤 Друзья</h1>

      <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 text-center text-[var(--tg-theme-hint-color)]">
        <p className="text-4xl mb-2">🤝</p>
        <p className="font-medium text-[var(--tg-theme-text-color)]">Добавь друзей</p>
        <p className="text-sm mt-1">
          Друзья, которые тоже используют readyOn, появятся здесь.
        </p>
        <p className="text-xs mt-2">Отправь другу ссылку на бота!</p>
      </div>
    </div>
  );
}
