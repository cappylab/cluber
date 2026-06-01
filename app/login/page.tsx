"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";

export default function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: u, password: p }),
    });
    if (res.ok) {
      const c = await fetch("/api/club").then((r) => (r.ok ? r.json() : null));
      router.push(c && c.exists ? "/" : "/setup");
    } else setErr((await res.json()).error || "로그인 실패");
  }

  return (
    <main className="login-shell">
      <div className="game-bg" aria-hidden="true" />
      <div className="game-vignette" aria-hidden="true" />
      <section className="login-card">
        <div className="brand-lockup" style={{ margin: "0 auto 12px" }}>
          <span className="brand-mascot image-mark">
            <Image src="/assets/game/cluber-logo-mark.png" alt="" width={64} height={64} priority />
          </span>
          <span className="brand-text">Cluber</span>
        </div>
        <Image
          className="login-mascot"
          src="/assets/game/cluber-mascot.png"
          alt=""
          width={220}
          height={330}
          priority
        />
        <h1>Cluber</h1>
        <p><Sparkles size={15} style={{ display: "inline", verticalAlign: "-2px" }} /> 동호회 관리 시스템</p>
        <form className="login-form" onSubmit={submit}>
          <input className="game-input" placeholder="아이디" value={u} onChange={(e) => setU(e.target.value)} aria-label="아이디" />
          <input className="game-input" type="password" placeholder="비밀번호" value={p} onChange={(e) => setP(e.target.value)} aria-label="비밀번호" />
          {err && <p className="login-error">{err}</p>}
          <button className="game-btn primary" type="submit"><LogIn size={18} />로그인</button>
        </form>
      </section>
    </main>
  );
}
