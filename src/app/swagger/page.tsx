export default function SwaggerPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">API dokumentacija (Swagger)</h1>
      <p className="mb-4 text-sm text-slate-600">
        Otvorite puni prikaz na <a className="text-blue-700 underline" href="/swagger-ui.html">/swagger-ui.html</a>.
      </p>
      <iframe
        title="Swagger UI"
        src="/swagger-ui.html"
        className="h-[80vh] w-full rounded-lg border border-slate-200 bg-white"
      />
    </main>
  );
}
