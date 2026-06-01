"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Coins, Trophy } from "lucide-react";
import { isAuthed, getPayments, type Payment } from "../store";
import { assetBySeed, memberAnimalAvatars } from "../gameAssets";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

function fmt(iso: string) {
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function LogPage() {
  const router = useRouter();
  const [items, setItems] = useState<Payment[]>([]);

  useEffect(() => {
    if (!isAuthed()) { router.replace("/login"); return; }
    setItems([...getPayments()].reverse());
  }, [router]);

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
            <Link className="nav-pill active" href="/log"><Coins size={18} />내역</Link>
          </nav>
          <div />
        </header>

        <section className="hero-hud">
          <div className="hero-copy">
            <div className="quest-badge"><Coins size={16} />납부 활동 일지</div>
            <h1>납부 내역</h1>
            <p>누가 언제 얼마를 납부했는지 시간순으로 기록됩니다.</p>
          </div>
        </section>

        <section className="main-panel" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="panel-heading">
            <div>
              <h2>최근 납부</h2>
              <p>총 {items.length}건</p>
            </div>
            <Link className="ghost-link" href="/">대시보드로</Link>
          </div>
          <div className="log-list">
            {items.map((p, i) => (
              <div className="log-row" key={`${p.name}-${p.date}-${i}`}>
                <span className="avatar animal-avatar small">
                  <Image src={assetBySeed(memberAnimalAvatars, p.name)} alt="" width={44} height={44} />
                </span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{fmt(p.date)}</small>
                </div>
                <b>+{won(p.amount)}</b>
              </div>
            ))}
            {items.length === 0 && (
              <div className="empty-state">
                <Coins size={28} />
                <span>아직 납부 기록이 없습니다.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
