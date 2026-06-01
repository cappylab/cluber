"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Medal, Trophy } from "lucide-react";
import { api, type Member } from "../api";
import { assetBySeed, memberAnimalAvatars } from "../gameAssets";

const shortWon = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

function AnimalAvatar({ name }: { name: string }) {
  const src = assetBySeed(memberAnimalAvatars, name);
  return (
    <span className="avatar animal-avatar">
      <Image src={src} alt={`${name} avatar`} width={54} height={54} />
    </span>
  );
}

export default function Ranking() {
  const [rows, setRows] = useState<Member[]>([]);

  useEffect(() => {
    api("/api/ranking").then((r) => setRows(r.ranking));
  }, []);

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
            <Link className="nav-pill active" href="/ranking"><Trophy size={18} />랭킹</Link>
            <Link className="nav-pill" href="/badges"><BadgeCheck size={18} />배지</Link>
          </nav>
          <div />
        </header>

        <section className="hero-hud">
          <div className="hero-copy">
            <div className="quest-badge"><Trophy size={16} />회비 랭킹</div>
            <h1>Top Members</h1>
            <p>납부 금액 기준으로 정렬된 클럽 기여 랭킹입니다.</p>
          </div>
        </section>

        <section className="main-panel" style={{ maxWidth: 920, margin: "0 auto" }}>
          <div className="panel-heading">
            <div>
              <h2>회비 랭킹</h2>
              <p>회원의 누적 납부 금액을 기준으로 표시됩니다.</p>
            </div>
            <Image
              className="ranking-prize"
              src="/assets/game/cluber-reward-trophy.png"
              alt=""
              width={260}
              height={174}
            />
            <Link className="ghost-link" href="/">대시보드로</Link>
          </div>
          <div className="rank-list">
            {rows.map((m, i) => (
              <div className="rank-row" key={m.name} style={{ gridTemplateColumns: "52px 52px minmax(0,1fr) auto" }}>
                <span className={`rank-medal rank-${Math.min(i + 1, 3)}`}>
                  {i < 3 ? <Medal size={20} /> : i + 1}
                </span>
                <AnimalAvatar name={m.name} />
                <div>
                  <strong>{m.name}</strong>
                  <small>{m.role}{m.position ? ` · ${m.position}` : ""}</small>
                </div>
                <b>{shortWon(m.fee)}</b>
              </div>
            ))}
            {rows.length === 0 && <div className="empty-state">등록된 회원이 없습니다.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
