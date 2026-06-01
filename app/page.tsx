"use client";
import { useEffect, useState, useCallback } from "react";
import { Users, Wallet, ChartColumn, Clock, Search, Plus, CreditCard, Pencil, Trash2, LogOut, Trophy } from "lucide-react";
import { api, type Member } from "./api";

type Stats = { count: number; total_fee: number; average_fee: number; unpaid: number; roles: Record<string, number> };
const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", student_id: "", type: "member", position: "" });

  const load = useCallback(async (query = "") => {
    const [s, m] = await Promise.all([api("/api/stats"), api(`/api/members?q=${encodeURIComponent(query)}`)]);
    setStats(s); setMembers(m.members);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    const r = await api("/api/members", { method: "POST", body: JSON.stringify(form) });
    if (r.error) return alert(r.error);
    setForm({ name: "", phone: "", student_id: "", type: "member", position: "" }); load(q);
  }
  async function pay(n: string) {
    const a = prompt(`${n} 회비 납부 금액?`); if (a === null) return;
    const r = await api(`/api/members/${encodeURIComponent(n)}/pay`, { method: "POST", body: JSON.stringify({ amount: Number(a) }) });
    if (r.error) alert(r.error); load(q);
  }
  async function edit(n: string) {
    const p = prompt(`${n} 새 연락처?`); if (!p) return;
    await api(`/api/members/${encodeURIComponent(n)}`, { method: "PATCH", body: JSON.stringify({ phone: p }) }); load(q);
  }
  async function del(n: string) {
    if (!confirm(`${n} 회원을 삭제할까요?`)) return;
    await api(`/api/members/${encodeURIComponent(n)}`, { method: "DELETE" }); load(q);
  }
  async function logout() { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }

  const orbs = stats ? [
    { I: Users, g: "from-violet-400 to-violet-600", l: "전체 회원", v: `${stats.count}명` },
    { I: Wallet, g: "from-pink-400 to-pink-600", l: "총 회비", v: won(stats.total_fee) },
    { I: ChartColumn, g: "from-sky-400 to-sky-600", l: "평균 회비", v: won(stats.average_fee) },
    { I: Clock, g: "from-amber-300 to-amber-500", l: "미납 회원", v: `${stats.unpaid}명` },
  ] : [];

  return (
    <main className="max-w-5xl mx-auto p-5 md:p-7">
      <header className="clay-card flex items-center justify-between gap-4 px-5 py-3 mb-7">
        <span className="font-display text-2xl font-black" style={{ background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Cluber</span>
        <nav className="flex gap-2 text-sm font-bold" style={{ color: "var(--muted)" }}>
          <a href="/" className="px-3 py-2 rounded-xl" style={{ color: "var(--violet)", boxShadow: "var(--sh-in)" }}>대시보드</a>
          <a href="/ranking" className="px-3 py-2 rounded-xl flex items-center gap-1"><Trophy size={16} />회비 랭킹</a>
        </nav>
        <button className="clay-btn px-4 py-2 flex items-center gap-2" onClick={logout}><LogOut size={18} />로그아웃</button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {orbs.map(({ I, g, l, v }) => (
          <div key={l} className="clay-card p-5">
            <div className="well w-[62px] h-[62px] mb-3"><div className={`orb w-11 h-11 bg-linear-to-br ${g}`}><I size={22} /></div></div>
            <div className="text-[13px]" style={{ color: "var(--muted)" }}>{l}</div>
            <div className="font-display text-2xl font-black">{v}</div>
          </div>
        ))}
      </section>

      <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex gap-3 mb-4">
        <div className="clay-input flex-1 flex items-center gap-2 px-4 py-3"><Search size={18} color="var(--muted)" />
          <input className="bg-transparent outline-none w-full" placeholder="이름 또는 연락처 검색" value={q} onChange={(e) => setQ(e.target.value)} aria-label="회원 검색" /></div>
        <button className="clay-btn px-5">검색</button>
      </form>

      <form onSubmit={add} className="clay-card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <input className="clay-input px-3 py-2" placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="이름" />
        <input className="clay-input px-3 py-2" placeholder="연락처" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="연락처" />
        <input className="clay-input px-3 py-2" placeholder="학번(선택)" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} aria-label="학번" />
        <select className="clay-input px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label="구분">
          <option value="member">일반회원</option><option value="officer">운영진</option>
        </select>
        {form.type === "officer" && <input className="clay-input px-3 py-2" placeholder="직책" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} aria-label="직책" />}
        <button className="clay-btn clay-btn-primary px-4 py-2 flex items-center gap-2" type="submit"><Plus size={18} />회원 추가</button>
      </form>

      <div className="clay-card p-3">
        {members.map((m) => (
          <div key={m.name} className="grid grid-cols-[1.4fr_1fr_1.2fr_auto] items-center gap-3 px-4 py-3 rounded-2xl">
            <div><div className="font-bold">{m.name}</div><div className="text-xs" style={{ color: "var(--muted)" }}>학번 {m.student_id || "-"} · 가입 {m.joined_date}</div></div>
            <div>{m.role === "운영진" ? <span className="badge badge-officer">운영진 · {m.position}</span> : <span className="badge badge-general">일반회원</span>}</div>
            <div className="flex items-center gap-2"><span className="font-display font-extrabold">{won(m.fee)}</span>{m.paid ? <span className="badge badge-paid">납부</span> : <span className="badge badge-unpaid">미납</span>}</div>
            <div className="flex gap-2">
              <button className="icon-btn w-10 h-10" aria-label="회비 납부" onClick={() => pay(m.name)}><CreditCard size={18} /></button>
              <button className="icon-btn w-10 h-10" aria-label="회원 수정" onClick={() => edit(m.name)}><Pencil size={18} /></button>
              <button className="icon-btn danger w-10 h-10" aria-label="회원 삭제" onClick={() => del(m.name)}><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
        {members.length === 0 && <div className="px-4 py-6" style={{ color: "var(--muted)" }}>등록된 회원이 없습니다.</div>}
      </div>
    </main>
  );
}
