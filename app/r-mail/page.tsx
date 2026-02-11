export default function RMailPage() {
  return (
    <div className="space-y-6">
      <div className="bg-rmail-mocha shadow-lg rounded-lg p-6 border border-rmail-ash">
        <h2 className="text-2xl font-bold text-rmail-offwhite mb-4">Welcome to R-MAIL</h2>
        <p className="text-rmail-taupe mb-6">
          Your secure SaaS email service with comprehensive role-based access control,
          internal and external email delivery, and full audit logging.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a 
            href="/r-mail/inbox" 
            className="block p-6 bg-rmail-slate rounded-lg hover:bg-rmail-ash transition border border-rmail-ash"
          >
            <h3 className="text-lg font-semibold text-rmail-steel mb-2">Inbox</h3>
            <p className="text-rmail-taupe">View and manage your emails</p>
          </a>
          
          <a 
            href="/r-mail/compose" 
            className="block p-6 bg-rmail-slate rounded-lg hover:bg-rmail-ash transition border border-rmail-ash"
          >
            <h3 className="text-lg font-semibold text-rmail-steel mb-2">Compose</h3>
            <p className="text-rmail-taupe">Send new emails</p>
          </a>
          
          <a 
            href="/r-mail/admin" 
            className="block p-6 bg-rmail-slate rounded-lg hover:bg-rmail-ash transition border border-rmail-ash"
          >
            <h3 className="text-lg font-semibold text-rmail-steel mb-2">Admin</h3>
            <p className="text-rmail-taupe">Manage users and domains</p>
          </a>
        </div>
      </div>

      <div className="bg-rmail-mocha shadow-lg rounded-lg p-6 border border-rmail-ash">
        <h3 className="text-xl font-bold text-rmail-offwhite mb-4">Features</h3>
        <ul className="space-y-3 text-rmail-taupe">
          <li className="flex items-start">
            <span className="text-rmail-steel mr-2">✓</span>
            <span>Role-based access control (Admin, Support, Client, External)</span>
          </li>
          <li className="flex items-start">
            <span className="text-rmail-steel mr-2">✓</span>
            <span>Granular permissions (send, receive, manage users, manage domains)</span>
          </li>
          <li className="flex items-start">
            <span className="text-rmail-steel mr-2">✓</span>
            <span>Internal and external email delivery</span>
          </li>
          <li className="flex items-start">
            <span className="text-rmail-steel mr-2">✓</span>
            <span>Comprehensive audit logging and compliance tracking</span>
          </li>
          <li className="flex items-start">
            <span className="text-rmail-steel mr-2">✓</span>
            <span>Domain management and verification</span>
          </li>
          <li className="flex items-start">
            <span className="text-rmail-steel mr-2">✓</span>
            <span>Email folders (Inbox, Sent, Drafts, Trash, Spam, Archive)</span>
          </li>
        </ul>
      </div>

      <div className="bg-rmail-mocha shadow-lg rounded-lg p-6 border border-rmail-ash">
        <h3 className="text-xl font-bold text-rmail-offwhite mb-4">User Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-rmail-ash rounded bg-rmail-slate">
            <h4 className="font-semibold text-rmail-steel mb-2">Admin</h4>
            <p className="text-sm text-rmail-taupe">Full system access and management</p>
          </div>
          <div className="p-4 border border-rmail-ash rounded bg-rmail-slate">
            <h4 className="font-semibold text-rmail-steel mb-2">Support</h4>
            <p className="text-sm text-rmail-taupe">User management and support functions</p>
          </div>
          <div className="p-4 border border-rmail-ash rounded bg-rmail-slate">
            <h4 className="font-semibold text-rmail-steel mb-2">Client</h4>
            <p className="text-sm text-rmail-taupe">Send and receive emails</p>
          </div>
          <div className="p-4 border border-rmail-ash rounded bg-rmail-slate">
            <h4 className="font-semibold text-rmail-sand mb-2">External</h4>
            <p className="text-sm text-rmail-taupe">Limited external recipient access</p>
          </div>
        </div>
      </div>
    </div>
  )
}
