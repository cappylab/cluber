"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Coins, Home, Trophy } from "lucide-react";

const items = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/ranking", label: "랭킹", Icon: Trophy },
  { href: "/badges", label: "배지", Icon: BadgeCheck },
  { href: "/log", label: "내역", Icon: Coins },
];

export default function BottomNav() {
  const path = usePathname();
  if (path === "/login" || path === "/setup") return null;
  return (
    <nav className="bottom-nav" aria-label="모바일 메뉴">
      {items.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={`bottom-nav-item${path === href ? " active" : ""}`}>
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
