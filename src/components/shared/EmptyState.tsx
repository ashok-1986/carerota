export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate">
      <h3 className="text-lg font-semibold text-midnight">{title}</h3>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  );
}
