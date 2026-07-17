/**
 * Generic "coming soon" placeholder for dashboard pages whose real content
 * is built in a later phase. Keeps every placeholder page consistent and
 * makes it obvious (to you, testing) which phase to expect it in.
 */
export default function PlaceholderPage({ title, phase, description }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-dark mb-1">{title}</h1>
      <p className="text-sm text-slate-500 mb-6">{description}</p>

      <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
        <p className="text-sm text-slate-400">
          {typeof phase === 'number' ? (
            <>Built in <span className="font-medium text-slate-600">Phase {phase}</span></>
          ) : (
            <span className="font-medium text-slate-600">Coming soon</span>
          )}
        </p>
      </div>
    </div>
  )
}
