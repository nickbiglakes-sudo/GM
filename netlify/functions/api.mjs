// GM Tech Snow Tracker — data API backed by Netlify Blobs.
// GET  /api/state  -> { docs: { "events/<id>": {...}, "config/roster": {...} } }
// POST /api/doc    -> { op: "set" | "update" | "delete", path, data }
import { getStore } from "@netlify/blobs";

const PATH_RE = /^(events\/[A-Za-z0-9_-]{1,64}|config\/roster)$/;
const DEFAULT_ROSTER = { people: ["Aaron", "Greg T", "Jamie P", "Justin G", "Nancy A", "Patrick G", "Scott B", "Vinny S"] };
const MAX_BYTES = 256 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

// Objects merge recursively; arrays and other values replace.
function deepMerge(target, patch) {
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object" || Array.isArray(target[k])) target[k] = {};
      deepMerge(target[k], v);
    } else target[k] = v;
  }
  return target;
}

export default async (req) => {
  const store = getStore({ name: "gm-tech-snow-tracker", consistency: "strong" });
  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/?/, "");

  try {
    if (req.method === "GET" && route === "state") {
      const docs = {};
      const { blobs } = await store.list({ prefix: "events/" });
      await Promise.all(
        blobs.map(async (b) => {
          const d = await store.get(b.key, { type: "json" });
          if (d) docs[b.key] = d;
        })
      );
      let roster = await store.get("config/roster", { type: "json" });
      if (!roster) {
        roster = DEFAULT_ROSTER;
        await store.setJSON("config/roster", roster);
      }
      docs["config/roster"] = roster;
      return json({ docs });
    }

    if (req.method === "POST" && route === "doc") {
      const body = await req.json().catch(() => null);
      if (!body || !PATH_RE.test(body.path || "")) return json({ code: "invalid_argument", message: "Bad path" }, 400);
      const { op, path, data } = body;

      if (op === "delete") {
        await store.delete(path);
        return json({ ok: true });
      }
      if (!data || typeof data !== "object" || Array.isArray(data))
        return json({ code: "invalid_argument", message: "Body must be an object" }, 400);

      let next;
      if (op === "set") next = data;
      else if (op === "update") {
        const cur = await store.get(path, { type: "json" });
        if (!cur) return json({ code: "invalid_argument", message: "Document does not exist" }, 400);
        next = deepMerge(cur, data);
      } else return json({ code: "invalid_argument", message: "Unknown op" }, 400);

      if (JSON.stringify(next).length > MAX_BYTES) return json({ code: "quota_exceeded", message: "Document too large" }, 413);
      await store.setJSON(path, next);
      return json({ ok: true });
    }

    return json({ code: "invalid_argument", message: "Not found" }, 404);
  } catch (e) {
    return json({ code: "unavailable", message: String((e && e.message) || e) }, 500);
  }
};

export const config = { path: "/api/*" };
