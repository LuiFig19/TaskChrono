export default function Loading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-2 pb-6 animate-pulse">
      <div className="h-6 w-40 bg-slate-800 rounded" />
      <div className="mt-4 grid lg:grid-cols-2 gap-6">
        <div className="h-40 bg-slate-800 rounded" />
        <div className="h-40 bg-slate-800 rounded" />
      </div>
    </div>
  );
}
