import { getStore } from "@netlify/blobs";

const CLIENTS_KEY = "clients";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: HEADERS });
  }

  try {
    const url = new URL(req.url);
    const provided = url.searchParams.get("pw");
    const expected = process.env.TRACKER_PASSWORD;

    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: HEADERS });
    }

    const store = getStore({ name: "churn-tracker", consistency: "strong" });

    if (req.method === "GET") {
      let data = [];
      try { data = await store.get(CLIENTS_KEY, { type: "json" }) || []; } catch (e) { data = []; }
      return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });
    }

    if (req.method === "POST") {
      const body = await req.json();
      await store.setJSON(CLIENTS_KEY, body);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: HEADERS });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: HEADERS });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: HEADERS });
  }
};

export const config = { path: "/api/clients" };
