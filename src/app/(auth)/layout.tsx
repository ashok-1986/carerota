export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-midnight flex-col justify-between p-10 xl:p-16">
        <div>
          <h1 className="font-display font-semibold text-4xl text-gold tracking-wide">CareRota</h1>
          <p className="text-pearl/70 text-base mt-3">Care home operations for Gold Care Homes</p>
        </div>
        <div>
          <p className="text-gold/80 text-lg font-display font-semibold">Built for Marlborough Court</p>
          <p className="text-pearl/40 text-sm mt-2">Staff scheduling, leave management, and cost tracking — all in one place.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-pearl p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="font-display font-semibold text-3xl text-gold tracking-wide">CareRota</h1>
            <p className="text-slate text-sm mt-1">Built for Marlborough Court</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}