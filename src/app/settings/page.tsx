export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
      
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-slate-800">Demo Configuration</h2>
        <p className="text-slate-600 mb-6">
          This is a prototype built for the ColdSync internship interview assignment. 
          The data is seeded realistically to simulate Denise's daily operations.
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-slate-900">OpenAI Integration</h3>
            <p className="text-sm text-slate-500">
              The AI lead extraction uses the API key configured in environment variables. 
              If unavailable, it gracefully degrades to manual entry.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Database</h3>
            <p className="text-sm text-slate-500">
              Connected to MongoDB Atlas. Connection pooling is enabled for Next.js hot-reloading.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
