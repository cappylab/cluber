"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { api, type Member } from "../api";
const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export default function Ranking() {
  const [rows, setRows] = useState<Member[]>([]);
  useEffect(() => { api("/api/ranking").then((r) => setRows(r.ranking)); }, []);
  return (
    <main className="max-w-3xl mx-auto p-5 md:p-7">
      <header className="clay-card flex items-center gap-3 px-5 py-3 mb-6">
        <a href="/" className="icon-btn w-10 h-10" aria-label="대시보드로"><ArrowLeft size={18} /></a>
        <h1 className="font-display text-xl font-extrabold flex items-center gap-2"><Trophy size={20} color="var(--amber)" />회비 랭킹</h1>
      </header>
      <div className="clay-card p-3">
        {rows.map((m, i) => (
          <div key={m.name} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 rounded-2xl">
            <span className="font-display font-black w-7 text-center">{i + 1}</span>
            <span className="font-bold">{m.name}</span>
            <span className="text-sm" style={{ color: "var(--muted)" }}>{m.role}</span>
            <span className="font-display font-extrabold">{won(m.fee)}</span>
          </div>
        ))}
        {rows.length === 0 && <div className="px-4 py-6" style={{ color: "var(--muted)" }}>등록된 회원이 없습니다.</div>}
      </div>
    </main>
  );
}
