import { getStore } from "@netlify/blobs";

const CLIENTS_KEY = "clients";

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const expected = process.env.TRACKER_PASSWORD;
  let provided = null;
  let clientData = null;

  try {
    const body = await req.json();
    provided = body.password;
    clientData = body.data;
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers });
  }

  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  }

  try {
    const store = getStore({ name: "churn-tracker", consistency: "strong" });

    if (req.method === "GET" || clientData === undefined) {
      let data = [];
      try { data = await store.get(CLIENTS_KEY, { type: "json" }) || []; } catch (e) { data = []; }
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    if (req.method === "POST") {
      await store.setJSON(CLIENTS_KEY, clientData);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
};

export const config = { path: "/api/clients" };
