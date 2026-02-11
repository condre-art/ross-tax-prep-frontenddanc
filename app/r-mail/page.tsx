export default function RMailPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to R-MAIL</h2>
        <p className="text-gray-600 mb-6">
          Your secure SaaS email service with comprehensive role-based access control,
          internal and external email delivery, and full audit logging.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a 
            href="/r-mail/inbox" 
            className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Inbox</h3>
            <p className="text-blue-700">View and manage your emails</p>
          </a>
          
          <a 
            href="/r-mail/compose" 
            className="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition"
          >
            <h3 className="text-lg font-semibold text-green-900 mb-2">Compose</h3>
            <p className="text-green-700">Send new emails</p>
          </a>
          
          <a 
            href="/r-mail/admin" 
            className="block p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Admin</h3>
            <p className="text-purple-700">Manage users and domains</p>
          </a>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Features</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Role-based access control (Admin, Support, Client, External)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Granular permissions (send, receive, manage users, manage domains)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Internal and external email delivery</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Comprehensive audit logging and compliance tracking</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Domain management and verification</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Email folders (Inbox, Sent, Drafts, Trash, Spam, Archive)</span>
          </li>
        </ul>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">User Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded">
            <h4 className="font-semibold text-red-600 mb-2">Admin</h4>
            <p className="text-sm text-gray-600">Full system access and management</p>
          </div>
          <div className="p-4 border rounded">
            <h4 className="font-semibold text-orange-600 mb-2">Support</h4>
            <p className="text-sm text-gray-600">User management and support functions</p>
          </div>
          <div className="p-4 border rounded">
            <h4 className="font-semibold text-blue-600 mb-2">Client</h4>
            <p className="text-sm text-gray-600">Send and receive emails</p>
          </div>
          <div className="p-4 border rounded">
            <h4 className="font-semibold text-gray-600 mb-2">External</h4>
            <p className="text-sm text-gray-600">Limited external recipient access</p>
          </div>
        </div>
      </div>
    </div>
  )
}
