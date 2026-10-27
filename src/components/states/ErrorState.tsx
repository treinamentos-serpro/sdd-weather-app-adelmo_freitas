interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
      <div role="alert">
        <h2 className="text-xl font-semibold text-rose-200">Não foi possível carregar o clima</h2>
        <p className="mt-3 break-words text-slate-200">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-11 rounded-xl bg-accent-400 px-5 font-semibold text-night-900 transition-colors hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}
