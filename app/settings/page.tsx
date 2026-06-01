"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, LogOut, RotateCcw, Trash2, Trophy, UserCog } from "lucide-react";
import { isAuthed, logout, clearData } from "../store";

export default function SettingsPage() {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthed()) router.replace("/login");
  }, [router]);

  function reset() {
    clearData();
    router.replace("/setup");
  }
  function doLogout() {
    logout();
    router.push("/login");
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
          </nav>
          <div />
        </header>

        <section className="hero-hud">
          <div className="hero-copy">
            <div className="quest-badge"><UserCog size={16} />계정 · 설정</div>
            <h1>설정</h1>
            <p>계정 정보를 확인하고 발표용으로 데이터를 초기화할 수 있어요.</p>
          </div>
        </section>

        <section className="main-panel" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="panel-heading">
            <div><h2>계정</h2><p>현재 로그인한 관리자</p></div>
          </div>
          <div className="settings-row">
            <span className="avatar avatar-violet">운</span>
            <div><strong>운영진 (admin)</strong><small>동호회 관리자 계정</small></div>
            <button className="game-btn secondary" onClick={doLogout}><LogOut size={18} />로그아웃</button>
          </div>

          <div className="panel-heading" style={{ marginTop: 20 }}>
            <div><h2>데이터</h2><p>발표 전 깨끗한 상태로 초기화</p></div>
          </div>
          <div className="settings-row">
            <span className="settings-warn"><RotateCcw size={20} /></span>
            <div><strong>데이터 초기화</strong><small>모든 회원과 클럽 정보를 삭제합니다.</small></div>
            <button className="game-btn danger-btn" onClick={() => setConfirm(true)}><RotateCcw size={18} />초기화</button>
          </div>
        </section>
      </div>

      {confirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="데이터 초기화">
          <div className="game-modal">
            <h2>데이터를 초기화할까요?</h2>
            <p>모든 회원과 클럽 정보가 삭제되고 처음 설정 화면으로 돌아갑니다. 되돌릴 수 없습니다.</p>
            <div className="modal-actions">
              <button className="game-btn secondary" onClick={() => setConfirm(false)}>취소</button>
              <button className="game-btn danger-btn" onClick={reset}><Trash2 size={18} />초기화</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
