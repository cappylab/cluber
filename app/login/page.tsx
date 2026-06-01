"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";
import { login, getClub } from "../store";

export default function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (u === "admin" && p === "cluber2026") {
      login();
      router.push(getClub() ? "/" : "/setup");
    } else {
      setErr("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
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
