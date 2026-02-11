export default function RMailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-rmail-espresso">
      <nav className="bg-rmail-mocha text-rmail-offwhite shadow-lg border-b border-rmail-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">R-MAIL</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/r-mail" className="hover:bg-rmail-slate px-3 py-2 rounded transition">Inbox</a>
              <a href="/r-mail/compose" className="hover:bg-rmail-slate px-3 py-2 rounded transition">Compose</a>
              <a href="/r-mail/admin" className="hover:bg-rmail-slate px-3 py-2 rounded transition">Admin</a>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
