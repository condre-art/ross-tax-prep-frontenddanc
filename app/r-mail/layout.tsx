export default function RMailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">R-MAIL</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/r-mail" className="hover:bg-blue-700 px-3 py-2 rounded">Inbox</a>
              <a href="/r-mail/compose" className="hover:bg-blue-700 px-3 py-2 rounded">Compose</a>
              <a href="/r-mail/admin" className="hover:bg-blue-700 px-3 py-2 rounded">Admin</a>
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
