"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    if (res.ok) router.push("/");
    else setErr((await res.json()).error || "로그인 실패");
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="clay-card w-full max-w-sm p-8 grid gap-4">
        <h1 className="font-display text-3xl font-black text-center"
            style={{ background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          Cluber
        </h1>
        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>동호회 관리 시스템</p>
        <input className="clay-input px-4 py-3" placeholder="아이디" value={u} onChange={(e) => setU(e.target.value)} aria-label="아이디" />
        <input className="clay-input px-4 py-3" type="password" placeholder="비밀번호" value={p} onChange={(e) => setP(e.target.value)} aria-label="비밀번호" />
        {err && <p className="text-sm" style={{ color: "var(--danger)" }}>{err}</p>}
        <button className="clay-btn clay-btn-primary px-4 py-3" type="submit">로그인</button>
      </form>
    </main>
  );
}
