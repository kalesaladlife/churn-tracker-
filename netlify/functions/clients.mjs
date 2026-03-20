import { getStore } from "@netlify/blobs";

const CLIENTS_KEY = "clients";

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Password",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const provided = req.headers.get("X-Password");
  const expected = process.env.TRACKER_PASSWORD;

  // Debug log — we'll remove this once it's working
  console.log("PROVIDED:", JSON.stringify(provided));
  console.log("EXPECTED:", JSON.stringify(expected));
  console.log("MATCH:", provided === expected);

  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized", debug: { expected: expected ? "is set" : "NOT SET", provided: provided ? "is set" : "NOT SET" } }), { status: 401, headers });
  }

  try {
    const store = getStore({ name: "churn-tracker", consistency: "strong" });

    if (req.method === "GET") {
      let data = [];
      try { data = await store.get(CLIENTS_KEY, { type: "json" }) || []; } catch (e) { data = []; }
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    if (req.method === "POST") {
      const body = await req.json();
      await store.setJSON(CLIENTS_KEY, body);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
};

export const config = { path: "/api/clients" };
