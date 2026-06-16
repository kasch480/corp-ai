export function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex h-dvh flex-1 flex-col bg-white">
      <div className="border-b border-zinc-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">Kommt bald</p>
          <p className="mt-1 text-sm text-zinc-400">
            Diese Funktion ist im Prototyp noch nicht aktiv.
          </p>
        </div>
      </div>
    </div>
  );
}
