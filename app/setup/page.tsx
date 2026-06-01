"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Plus, Target, Users } from "lucide-react";
import { api } from "../api";
import { isAuthed } from "../store";

const won = (n: number) => `₩${(n || 0).toLocaleString("ko-KR")}`;

export default function Setup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", student_id: "", type: "member", position: "" });
  const [added, setAdded] = useState<string[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isAuthed()) { router.replace("/login"); return; }
    api("/api/club").then((d) => { if (d?.exists) router.replace("/"); }).catch(() => {});
  }, [router]);

  async function saveClubNext() {
    const g = Number(goal);
    if (!name.trim() || !Number.isFinite(g) || g < 0) { setErr("이름과 목표(0 이상)를 입력하세요."); return; }
    const r = await api("/api/club", { method: "POST", body: JSON.stringify({ name: name.trim(), goal: g }) });
    if (r.error) { setErr(r.error); return; }
    setErr(""); setStep(3);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    const r = await api("/api/members", { method: "POST", body: JSON.stringify(form) });
    if (r.error) { setErr(r.error); return; }
    setAdded([...added, form.name]);
    setForm({ name: "", phone: "", student_id: "", type: "member", position: "" });
    setErr("");
  }

  return (
    <main className="setup-shell">
      <div className="game-bg" aria-hidden="true" />
      <div className="game-vignette" aria-hidden="true" />

      <section className="setup-card">
        <div className="setup-steps" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`setup-dot ${step >= n ? "on" : ""}`}>{step > n ? <Check size={16} /> : n}</span>
          ))}
        </div>

        {step === 1 && (
          <div className="setup-body">
            <Image className="setup-mascot" src="/assets/game/cluber-mascot.png" alt="" width={200} height={300} priority />
            <h1>동아리를 만들어요</h1>
            <p>관리할 동호회 이름을 입력하세요.</p>
            <input className="game-input setup-input" placeholder="동아리 이름 (예: 코딩 동아리)" value={name} onChange={(e) => setName(e.target.value)} aria-label="동아리 이름" />
            <button className="game-btn primary setup-next" disabled={!name.trim()} onClick={() => { setErr(""); setStep(2); }}>다음 <ArrowRight size={18} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-body">
            <span className="setup-emoji"><Target size={36} /></span>
            <h1>이번 달 목표 회비</h1>
            <p>이번 달 모으고 싶은 회비 금액을 직접 입력하세요.</p>
            <input className="game-input setup-input" inputMode="numeric" placeholder="예: 4500000" value={goal} onChange={(e) => setGoal(e.target.value.replace(/[^0-9]/g, ""))} aria-label="목표 회비" />
            <div className="setup-goal-preview">{won(Number(goal))}</div>
            {err && <p className="login-error">{err}</p>}
            <div className="setup-actions">
              <button className="game-btn secondary" onClick={() => { setErr(""); setStep(1); }}>이전</button>
              <button className="game-btn primary" disabled={!goal} onClick={saveClubNext}>다음 <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-body">
            <span className="setup-emoji"><Users size={36} /></span>
            <h1>첫 회원 추가</h1>
            <p>지금 추가하거나, 나중에 대시보드에서 추가할 수 있어요.</p>
            <form className="setup-form" onSubmit={addMember}>
              <input className="game-input" placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="이름" />
              <input className="game-input" placeholder="연락처" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="연락처" />
              <input className="game-input" placeholder="학번(선택)" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} aria-label="학번" />
              <select className="game-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label="구분">
                <option value="member">일반회원</option>
                <option value="officer">운영진</option>
              </select>
              {form.type === "officer" && (
                <input className="game-input" placeholder="직책" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} aria-label="직책" />
              )}
              <button className="game-btn secondary" type="submit"><Plus size={18} />회원 추가</button>
            </form>
            {added.length > 0 && (
              <div className="setup-added">{added.map((n) => <span key={n} className="badge badge-paid"><Check size={13} />{n}</span>)}</div>
            )}
            {err && <p className="login-error">{err}</p>}
            <button className="game-btn primary setup-next" onClick={() => router.push("/")}>완료 <ArrowRight size={18} /></button>
          </div>
        )}
      </section>
    </main>
  );
}
