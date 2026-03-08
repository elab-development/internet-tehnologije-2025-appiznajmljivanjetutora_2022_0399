import Script from "next/script";

export default function SwaggerPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
      />
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900">Swagger API Dokumentacija</h1>
          <p className="mt-1 text-sm text-slate-600">
            OpenAPI pregled glavnih ruta. JSON specifikacija je dostupna na
            {" "}
            <a className="font-medium text-blue-700 hover:text-blue-800" href="/api/openapi">
              /api/openapi
            </a>
            .
          </p>
        </div>

        <Script
          src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
          strategy="afterInteractive"
        />
        <Script id="swagger-ui-init" strategy="afterInteractive">
          {`
            window.addEventListener("load", function () {
              if (!window.SwaggerUIBundle) return;
              window.SwaggerUIBundle({
                url: "/api/openapi",
                dom_id: "#swagger-ui",
                deepLinking: true,
                presets: [window.SwaggerUIBundle.presets.apis],
                layout: "BaseLayout"
              });
            });
          `}
        </Script>

        <div id="swagger-ui" />
      </div>
    </main>
  );
}
