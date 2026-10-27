export default function LoadingState() {
  return (
    <div
      role="status"
      className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-100 backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="mx-auto mb-4 block size-8 rounded-full border-4 border-white/20 border-t-accent-400 motion-safe:animate-spin"
      />
      Carregando o clima…
    </div>
  );
}
