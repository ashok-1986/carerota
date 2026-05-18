export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100/5 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-heading font-semibold text-center text-midnight mb-6">CareRota</h1>
        {children}
      </div>
    </div>
  );
}
