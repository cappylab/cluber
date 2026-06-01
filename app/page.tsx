"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  Settings,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  CreditCard,
  Home,
  LogOut,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { api, type Member } from "./api";
import { isAuthed } from "./store";
import { assetBySeed, decorProps, memberAnimalAvatars } from "./gameAssets";

type Stats = {
  count: number;
  total_fee: number;
  average_fee: number;
  unpaid: number;
  roles: Record<string, number>;
};

const shortWon = (n: number) => `₩${n.toLocaleString("ko-KR")}`;
const monthlyGoal = 4_500_000;

function progress(now: number, goal: number) {
  if (!goal) return 0;
  return Math.min(100, Math.round((now / goal) * 100));
}

function AnimalAvatar({ name, size = "default" }: { name: string; size?: "default" | "small" | "tiny" }) {
  const src = assetBySeed(memberAnimalAvatars, name);
  const px = size === "tiny" ? 34 : size === "small" ? 44 : 54;
  return (
    <span className={`avatar animal-avatar ${size}`}>
      <Image src={src} alt={`${name} avatar`} width={px} height={px} />
    </span>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [club, setClub] = useState<{ name: string; goal: number } | null>(null);
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [loadError, setLoadError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", student_id: "", type: "member", position: "" });
  const [paymentTarget, setPaymentTarget] = useState<Member | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("150000");
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [editPhone, setEditPhone] = useState("");

  const load = useCallback(async (query = "") => {
    const [s, m] = await Promise.all([
      api("/api/stats"),
      api(`/api/members?q=${encodeURIComponent(query)}`),
    ]);
    if (s.error || m.error) {
      setLoadError(s.error || m.error);
      return;
    }
    setLoadError("");
    setStats(s);
    setMembers(m.members);
  }, []);

  useEffect(() => {
    if (!isAuthed()) { router.replace("/login"); return; }
    let cancelled = false;
    Promise.all([api("/api/stats"), api("/api/members?q="), api("/api/club")]).then(([s, m, c]) => {
      if (cancelled) return;
      if (c && c.exists === false) { router.replace("/setup"); return; }
      if (s.error || m.error) {
        setLoadError(s.error || m.error);
        return;
      }
      setLoadError("");
      setStats(s);
      setMembers(m.members);
      if (c && c.exists) setClub({ name: c.name, goal: c.goal });
    }).catch((error) => {
      if (!cancelled) setLoadError(error instanceof Error ? error.message : "API 연결 실패");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    const r = await api("/api/members", { method: "POST", body: JSON.stringify(form) });
    if (r.error) return alert(r.error);
    setForm({ name: "", phone: "", student_id: "", type: "member", position: "" });
    setAddOpen(false);
    load(q);
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentTarget) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount < 0) return;
    const r = await api(`/api/members/${encodeURIComponent(paymentTarget.name)}/pay`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
    if (r.error) alert(r.error);
    setPaymentTarget(null);
    setPaymentAmount("150000");
    load(q);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editPhone.trim()) return;
    const r = await api(`/api/members/${encodeURIComponent(editTarget.name)}`, {
      method: "PATCH",
      body: JSON.stringify({ phone: editPhone.trim() }),
    });
    if (r.error) alert(r.error);
    setEditTarget(null);
    setEditPhone("");
    load(q);
  }

  async function del(n: string) {
    if (!confirm(`${n} 회원을 삭제할까요?`)) return;
    await api(`/api/members/${encodeURIComponent(n)}`, { method: "DELETE" });
    load(q);
  }

  async function logout() {
    await api("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const goal = club?.goal ?? monthlyGoal;
  const goalPercent = progress(stats?.total_fee ?? 0, goal);
  const generalCount = stats?.roles?.["일반회원"] ?? 0;
  const officerCount = stats?.roles?.["운영진"] ?? 0;

  const statCards = stats
    ? [
        {
          img: "members",
          label: "전체 회원",
          value: `${stats.count}명`,
          helper: `일반 ${generalCount} · 운영진 ${officerCount}`,
          color: "violet",
          percent: Math.min(100, stats.count),
        },
        {
          img: "money",
          label: "총 회비",
          value: shortWon(stats.total_fee),
          helper: "누적 납부 금액",
          color: "pink",
          percent: goalPercent,
        },
        {
          img: "chart",
          label: "평균 회비",
          value: shortWon(stats.average_fee),
          helper: "회원 1인당 평균",
          color: "sky",
          percent: Math.min(100, Math.round(stats.average_fee / 3000)),
        },
        {
          img: "clock",
          label: "미납 회원",
          value: `${stats.unpaid}명`,
          helper: "납부하지 않은 회원",
          color: "amber",
          percent: stats.count ? Math.round((stats.unpaid / stats.count) * 100) : 0,
        },
      ]
    : [];

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
            <Link className="nav-pill active" href="/"><Home size={18} />홈</Link>
            <a className="nav-pill" href="#members"><Users size={18} />회원</a>
            <a className="nav-pill" href="#fees"><CreditCard size={18} />회비</a>
            <Link className="nav-pill" href="/ranking"><Trophy size={18} />랭킹</Link>
            <Link className="nav-pill" href="/badges"><BadgeCheck size={18} />배지</Link>
            <Link className="nav-pill" href="/log"><Coins size={18} />내역</Link>
          </nav>
          <div className="player-actions">
            <Link className="round-btn" href="/settings" aria-label="설정"><Settings size={18} /></Link>
            <button className="player-chip" type="button" onClick={logout}>
              <span className="mini-avatar avatar-violet">운</span>
              <span>운영진</span>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <section className="hero-hud" aria-label="Cluber dashboard summary">
          <div className="hero-copy">
            <div className="quest-badge"><Sparkles size={16} />{club?.name ?? "동호회 회비 퀘스트"}</div>
            <h1>Cluber</h1>
            <p>회원 등록, 납부, 랭킹을 한 화면에서 관리하는 게임형 동호회 대시보드</p>
          </div>

          <div className="goal-card" id="fees">
            <div className="goal-top">
              <span className="goal-icon"><CircleDollarSign size={24} /></span>
              <div>
                <span>이번 달 목표</span>
                <strong>{shortWon(goal)}</strong>
              </div>
              <b>{goalPercent}%</b>
            </div>
            <div className="progress-track">
              <span style={{ width: `${goalPercent}%` }} />
            </div>
            <div className="goal-bottom">
              <span>현재 {shortWon(stats?.total_fee ?? 0)}</span>
              <span>남은 {shortWon(Math.max(0, goal - (stats?.total_fee ?? 0)))}</span>
            </div>
          </div>

          <div className="hero-showcase" aria-hidden="true">
            <div className="sparkle-field">
              <span />
              <span />
              <span />
              <span />
            </div>
            <Image className="floating-prop prop-rocket" src={decorProps[0]} alt="" width={76} height={76} />
            <Image className="floating-prop prop-speaker" src={decorProps[2]} alt="" width={66} height={66} />
            <Image
              className="hero-mascot-img"
              src="/assets/game/cluber-mascot.png"
              alt=""
              width={320}
              height={480}
              priority
            />
          </div>
        </section>

        <section className="stats-grid" aria-label="클럽 통계">
          {statCards.map(({ img, label, value, helper, color, percent }) => (
            <article className="stat-tile" key={label}>
              <div className={`stat-icon ${color}`}>
                <Image src={`/icons3d/${img}.png`} alt="" width={42} height={42} />
              </div>
              <div className="stat-copy">
                <span>{label}</span>
                <strong>{value}</strong>
                <em>{helper}</em>
              </div>
              <div className="mini-progress"><span style={{ width: `${percent}%` }} /></div>
            </article>
          ))}
        </section>

        <div className="dashboard-grid">
          <section className="main-panel" id="members">
            <div className="panel-heading">
              <div>
                <h2>회원 관리</h2>
                <p>회원을 검색하고 납부를 처리하세요.</p>
              </div>
              <button className="game-btn primary" type="button" onClick={() => setAddOpen(true)}><UserPlus size={18} />회원 추가</button>
            </div>

            {loadError && (
              <div className="api-banner">
                <AlertCircle size={18} />
                <span>API 연결 확인 필요 · {loadError}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="search-rail">
              <div className="game-input search-box">
                <Search size={19} />
                <input
                  placeholder="회원 검색"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="회원 검색"
                />
              </div>
              <button className="game-btn secondary" type="submit">검색</button>
            </form>

            <div className="member-board">
              <div className="member-head">
                <span>회원 정보</span>
                <span>구분</span>
                <span>회비</span>
                <span>납부 상태</span>
                <span>관리</span>
              </div>
              {members.map((m) => (
                <article className="member-row" key={m.name}>
                  <div className="member-profile">
                    <AnimalAvatar name={m.name} />
                    <div>
                      <strong>{m.name}</strong>
                      <small>{m.student_id || "-"} · {m.phone}</small>
                    </div>
                  </div>
                  <div>
                    {m.role === "운영진" ? (
                      <span className="badge badge-officer">운영진 · {m.position}</span>
                    ) : (
                      <span className="badge badge-general">일반회원</span>
                    )}
                  </div>
                  <strong className="fee-value">{shortWon(m.fee)}</strong>
                  <div>
                    {m.paid ? (
                      <span className="badge badge-paid"><CheckCircle2 size={13} />납부</span>
                    ) : (
                      <span className="badge badge-unpaid"><AlertCircle size={13} />미납</span>
                    )}
                    <small className="paid-date">{m.joined_date}</small>
                  </div>
                  <div className="row-actions">
                    <button className="icon-btn" type="button" aria-label="회비 납부" onClick={() => setPaymentTarget(m)}><CreditCard size={18} /></button>
                    <button className="icon-btn" type="button" aria-label="회원 수정" onClick={() => { setEditTarget(m); setEditPhone(m.phone); }}><Pencil size={18} /></button>
                    <button className="icon-btn danger" type="button" aria-label="회원 삭제" onClick={() => del(m.name)}><Trash2 size={18} /></button>
                  </div>
                </article>
              ))}
              {members.length === 0 && (
                <div className="empty-state">
                  <Users size={28} />
                  <span>등록된 회원이 없습니다.</span>
                </div>
              )}
            </div>
          </section>

          <aside className="side-stack">
            <section className="reward-card" aria-label="클럽 보상">
              <Image
                className="reward-art"
                src="/assets/game/cluber-reward-trophy.png"
                alt=""
                width={300}
                height={200}
                loading="eager"
              />
              <div>
                <strong><BadgeCheck size={18} /> 보상 상자 진행 중</strong>
                <span>목표 달성 시 클럽 활동비 리포트를 바로 확인할 수 있습니다.</span>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {addOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="회원 추가">
          <form className="game-modal" onSubmit={add}>
            <h2>회원 추가</h2>
            <p>새 회원 정보를 입력하세요.</p>
            <div className="login-form">
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
            </div>
            <div className="modal-actions">
              <button className="game-btn secondary" type="button" onClick={() => setAddOpen(false)}>취소</button>
              <button className="game-btn primary" type="submit"><Plus size={18} />추가</button>
            </div>
          </form>
        </div>
      )}

      {paymentTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="회비 납부">
          <form className="game-modal" onSubmit={submitPayment}>
            <h2>{paymentTarget.name} 회비 납부</h2>
            <p>금액을 입력하면 실제 회원 회비에 누적됩니다.</p>
            <input className="game-input" inputMode="numeric" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} aria-label="회비 납부 금액" />
            <div className="modal-actions">
              <button className="game-btn secondary" type="button" onClick={() => setPaymentTarget(null)}>취소</button>
              <button className="game-btn primary" type="submit"><CreditCard size={18} />납부 저장</button>
            </div>
          </form>
        </div>
      )}

      {editTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="회원 수정">
          <form className="game-modal" onSubmit={submitEdit}>
            <h2>{editTarget.name} 연락처 수정</h2>
            <p>새 연락처를 저장하면 회원 목록이 갱신됩니다.</p>
            <input className="game-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} aria-label="새 연락처" />
            <div className="modal-actions">
              <button className="game-btn secondary" type="button" onClick={() => setEditTarget(null)}>취소</button>
              <button className="game-btn primary" type="submit"><Pencil size={18} />저장</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
