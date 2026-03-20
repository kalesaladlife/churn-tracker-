import { getStore } from "@netlify/blobs";

const PASSWORD = process.env.TRACKER_PASSWORD || "changeme";
const CLIENTS_KEY = "clients";

export default async (req) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Password",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Password check
  const provided = req.headers.get("X-Password");
  if (provided !== PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers,
    });
  }

  const store = getStore("churn-tracker");

  // GET — load all clients
  if (req.method === "GET") {
    try {
      const data = await store.get(CLIENTS_KEY, { type: "json" });
      return new Response(JSON.stringify(data || []), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify([]), { status: 200, headers });
    }
  }

  // POST — save all clients (full replace)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      await store.setJSON(CLIENTS_KEY, body);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Save failed" }), {
        status: 500,
        headers,
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers,
  });
};

export const config = { path: "/api/clients" };
