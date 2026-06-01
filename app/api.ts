/* eslint-disable @typescript-eslint/no-explicit-any */
import * as store from "./store";

export type { Member } from "./store";

function localCompute(members: store.Member[], club: store.Club | null) {
  const total = members.reduce((s, m) => s + (m.fee || 0), 0);
  const count = members.length;
  const officer = members.filter((m) => m.role === "운영진").length;
  const goal = club?.goal || 0;
  return {
    stats: {
      count, total_fee: total, average_fee: count ? Math.round(total / count) : 0,
      unpaid: members.filter((m) => !m.paid).length,
      roles: { "일반회원": count - officer, "운영진": officer },
    },
    ranking: [...members].sort((a, b) => b.fee - a.fee),
    club: { name: club?.name || "", goal, progress: goal ? Math.min(100, Math.round((total / goal) * 100)) : 0, remaining: Math.max(0, goal - total) },
  };
}

// Primary path uses the stateless Python endpoint (Member/Officer/ClubManager/Club);
// falls back to local compute so the demo never breaks.
async function pyCompute(): Promise<any> {
  const members = store.getMembers();
  const club = store.getClub();
  try {
    const res = await fetch("/api/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        members: members.map((m) => ({ ...m, type: m.role === "운영진" ? "officer" : "member" })),
        goal: club?.goal || 0, name: club?.name || "",
      }),
    });
    if (res.ok) return await res.json();
  } catch {
    /* fall through to local compute */
  }
  return localCompute(members, club);
}

export async function api(path: string, init?: RequestInit): Promise<any> {
  const method = (init?.method || "GET").toUpperCase();
  const body: any = init?.body ? JSON.parse(init.body as string) : {};
  const [url, qs] = path.split("?");
  const q = new URLSearchParams(qs || "").get("q") || "";

  if (url === "/api/stats") return (await pyCompute()).stats;
  if (url === "/api/ranking") return { ranking: (await pyCompute()).ranking };

  if (url === "/api/club") {
    if (method === "POST") return store.saveClub(String(body.name || ""), Number(body.goal || 0));
    const c = store.getClub();
    return c ? { exists: true, name: c.name, goal: c.goal } : { exists: false };
  }

  if (url === "/api/members") {
    if (method === "POST") return store.addMember(body);
    return { members: store.searchMembers(q) };
  }

  if (url.startsWith("/api/members/")) {
    const rest = url.slice("/api/members/".length);
    if (rest.endsWith("/pay")) return store.payFee(decodeURIComponent(rest.slice(0, -4)), Number(body.amount));
    const name = decodeURIComponent(rest);
    if (method === "PATCH") return store.updatePhone(name, String(body.phone || ""));
    if (method === "DELETE") return store.deleteMember(name);
  }

  if (url === "/api/logout") { store.logout(); return { ok: true }; }

  return { error: "unknown route" };
}
