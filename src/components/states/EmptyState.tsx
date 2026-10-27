interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = 'Nenhuma cidade encontrada',
  hint = 'Confira o nome da cidade e tente uma nova busca.',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md"
    >
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-slate-300">{hint}</p>
    </div>
  );
}
