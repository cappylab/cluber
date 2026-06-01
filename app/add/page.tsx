"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, Coins, Plus, Trophy, UserPlus } from "lucide-react";
import { api } from "../api";
import { isAuthed } from "../store";

export default function AddMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", student_id: "", type: "member", position: "" });
  const [added, setAdded] = useState<string[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isAuthed()) router.replace("/login");
  }, [router]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) { setErr("이름과 연락처는 필수입니다."); return; }
    const r = await api("/api/members", { method: "POST", body: JSON.stringify(form) });
    if (r.error) { setErr(r.error); return; }
    setAdded([form.name, ...added]);
    setForm({ name: "", phone: "", student_id: "", type: "member", position: "" });
    setErr("");
  }

  return (
    <main className="game-shell">
      <div className="game-bg" aria-hidden="true" />
      <div className="game-vignette" aria-hidden="true" />
      <div className="game-stage">
        <header className="game-nav">
          <Link className="brand-lockup" href="/">
            <span className="brand-mascot image-mark">
              <Image src="/assets/game/cluber-logo-mark.png" alt="" width={64} height={64} priority />
            </span>
            <span className="brand-text">Cluber</span>
          </Link>
          <nav className="nav-tabs" aria-label="주요 메뉴">
            <Link className="nav-pill" href="/"><ArrowLeft size={18} />홈</Link>
            <Link className="nav-pill" href="/ranking"><Trophy size={18} />랭킹</Link>
            <Link className="nav-pill" href="/badges"><BadgeCheck size={18} />배지</Link>
            <Link className="nav-pill" href="/log"><Coins size={18} />내역</Link>
          </nav>
          <div />
        </header>

        <section className="hero-hud">
          <div className="hero-copy">
            <div className="quest-badge"><UserPlus size={16} />회원 등록</div>
            <h1>회원 추가</h1>
            <p>새 회원을 등록하세요. 여러 명을 연달아 추가할 수 있어요.</p>
          </div>
        </section>

        <section className="main-panel" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="panel-heading">
            <div><h2>새 회원</h2><p>이름과 연락처는 필수입니다.</p></div>
          </div>
          <form onSubmit={add} className="setup-form">
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
            {err && <p className="login-error">{err}</p>}
            <button className="game-btn primary setup-next" type="submit"><Plus size={18} />회원 추가</button>
          </form>

          {added.length > 0 && (
            <div className="setup-added" style={{ marginTop: 16 }}>
              {added.map((n, i) => <span key={`${n}-${i}`} className="badge badge-paid"><Check size={13} />{n}</span>)}
            </div>
          )}

          <Link className="game-btn secondary setup-next" href="/" style={{ marginTop: 16 }}><ArrowLeft size={18} />목록으로 돌아가기</Link>
        </section>
      </div>
    </main>
  );
}
