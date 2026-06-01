"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, Lock, Sparkles, Trophy } from "lucide-react";
import { api } from "../api";
import { achievementBadges } from "../gameAssets";

type Stats = { count: number; total_fee: number; unpaid: number; roles: Record<string, number> };

export default function Badges() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [goal, setGoal] = useState(0);

  useEffect(() => {
    Promise.all([api("/api/stats"), api("/api/club")]).then(([s, c]) => {
      if (c && c.exists === false) { router.replace("/setup"); return; }
      if (s && !s.error) setStats(s);
      if (c && c.exists) setGoal(c.goal);
    }).catch(() => {});
  }, [router]);

  const count = stats?.count ?? 0;
  const total = stats?.total_fee ?? 0;
  const unpaid = stats?.unpaid ?? 0;
  const officer = stats?.roles?.["운영진"] ?? 0;
  const general = stats?.roles?.["일반회원"] ?? 0;

  const defs = [
    { title: "왕관 메달", desc: "운영진 1명 이상", ok: officer >= 1 },
    { title: "클럽 인장", desc: "클럽 생성 완료", ok: true },
    { title: "스타 인증서", desc: "첫 회원 등록", ok: count >= 1 },
    { title: "참여 리본", desc: "회원 5명 이상", ok: count >= 5 },
    { title: "최고 기여자", desc: "회비 납부 시작", ok: total > 0 },
    { title: "완납 달성", desc: "전원 납부 완료", ok: count > 0 && unpaid === 0 },
    { title: "월간 목표", desc: "이번 달 목표 달성", ok: goal > 0 && total >= goal },
    { title: "자원봉사", desc: "일반회원 3명 이상", ok: general >= 3 },
    { title: "출석왕", desc: "회원 10명 이상", ok: count >= 10 },
    { title: "팀 리더", desc: "운영진 2명 이상", ok: officer >= 2 },
    { title: "기부 코인", desc: "총 회비 100만원 이상", ok: total >= 1_000_000 },
    { title: "업적 방패", desc: "총 회비 300만원 이상", ok: total >= 3_000_000 },
  ];
  const earned = defs.filter((d) => d.ok).length;

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
            <Link className="nav-pill active" href="/badges"><BadgeCheck size={18} />배지</Link>
          </nav>
          <div />
        </header>

        <section className="hero-hud">
          <div className="hero-copy">
            <div className="quest-badge"><Sparkles size={16} />업적 컬렉션</div>
            <h1>배지</h1>
            <p>클럽 활동으로 잠금 해제되는 {defs.length}개의 업적 배지입니다.</p>
          </div>
        </section>

        <section className="main-panel" style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div className="panel-heading">
            <div>
              <h2>업적</h2>
              <p>달성한 배지 {earned} / {defs.length}</p>
            </div>
            <Link className="ghost-link" href="/">대시보드로</Link>
          </div>
          <div className="badge-board">
            {defs.map((d, i) => (
              <article className={`badge-tile ${d.ok ? "earned" : "locked"}`} key={d.title}>
                <Image src={achievementBadges[i]} alt="" width={96} height={96} />
                <strong>{d.title}</strong>
                <span>{d.desc}</span>
                <em className={`badge-state ${d.ok ? "on" : ""}`}>
                  {d.ok ? <><Check size={13} />달성</> : <><Lock size={12} />잠금</>}
                </em>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
