export function Groups() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">👥 Группы</h1>

      <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 text-center text-[var(--tg-theme-hint-color)]">
        <p className="text-4xl mb-2">👥</p>
        <p className="font-medium text-[var(--tg-theme-text-color)]">Пока нет групп</p>
        <p className="text-sm mt-1">Создай группу в боте:</p>
        <code className="text-xs bg-black/20 px-2 py-1 rounded mt-2 inline-block">
          /group create CS Пацаны
        </code>
        <p className="text-sm mt-3">Или присоединись по инвайт-ссылке от друга</p>
      </div>
    </div>
  );
}
