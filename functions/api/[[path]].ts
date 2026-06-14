/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const pathname = url.pathname;

  const stubResponse = () =>
    new Response(
      JSON.stringify({
        success: true,
        data: [],
        message: "Not yet implemented — coming in a later prompt",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  const routes = [
    /^\/api\/verses(\/.*)?$/,
    /^\/api\/characters(\/.*)?$/,
    /^\/api\/relationships(\/.*)?$/,
    /^\/api\/lore(\/.*)?$/,
    /^\/api\/writing(\/.*)?$/,
    /^\/api\/chapters(\/.*)?$/,
    /^\/api\/ai\/conversations(\/.*)?$/,
    /^\/api\/settings$/,
    /^\/api\/verse-map\/nodes$/,
    /^\/api\/verse-map\/connections$/,
    /^\/api\/writing-guidelines$/,
    /^\/api\/tags$/,
    /^\/api\/tag-assignments$/,
    /^\/api\/story-arcs(\/.*)?$/,
    /^\/api\/foreshadowing(\/.*)?$/,
    /^\/api\/headcanons(\/.*)?$/,
    /^\/api\/version-history$/,
  ];

  if (routes.some((r) => r.test(pathname))) {
    return stubResponse();
  }

  return new Response(
    JSON.stringify({ success: false, error: "Not Found", message: "Route not found" }),
    { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
};
