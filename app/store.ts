export type Member = {
  name: string; phone: string; student_id: string; fee: number; paid: boolean;
  joined_date: string; role: string; position: string | null;
};
export type Club = { name: string; goal: number };

const MKEY = "cluber.members";
const CKEY = "cluber.club";
const PKEY = "cluber.payments";
const AKEY = "cluber.auth";

const today = () => new Date().toISOString().slice(0, 10);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, val: unknown) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(val));
}

export function getMembers(): Member[] { return read<Member[]>(MKEY, []); }
function setMembers(ms: Member[]) { write(MKEY, ms); }

export function searchMembers(q: string): Member[] {
  const kw = (q || "").trim().toLowerCase();
  const ms = getMembers();
  return kw ? ms.filter((m) => m.name.toLowerCase().includes(kw) || m.phone.toLowerCase().includes(kw)) : ms;
}

export function addMember(d: { name?: string; phone?: string; student_id?: string; type?: string; position?: string }) {
  const name = (d.name || "").trim();
  const phone = (d.phone || "").trim();
  if (!name || !phone) return { error: "이름과 연락처는 필수입니다." };
  const ms = getMembers();
  if (ms.some((m) => m.name === name)) return { error: `'${name}'은(는) 이미 등록된 회원입니다.` };
  const officer = d.type === "officer";
  const m: Member = {
    name, phone, student_id: d.student_id || "", fee: 0, paid: false, joined_date: today(),
    role: officer ? "운영진" : "일반회원", position: officer ? (d.position || "총무") : null,
  };
  setMembers([...ms, m]);
  return { member: m };
}

export function payFee(name: string, amount: number) {
  if (!(amount >= 0)) return { error: "회비는 0원 이상이어야 합니다." };
  const ms = getMembers();
  const m = ms.find((x) => x.name === name);
  if (!m) return { error: "회원을 찾을 수 없습니다." };
  m.fee += amount; m.paid = true; setMembers(ms);
  const ps = getPayments(); ps.push({ name, amount, date: new Date().toISOString() }); setPayments(ps);
  return { ok: true };
}

export function updatePhone(name: string, phone: string) {
  const ms = getMembers();
  const m = ms.find((x) => x.name === name);
  if (!m) return { error: "회원을 찾을 수 없습니다." };
  m.phone = phone; setMembers(ms);
  return { ok: true };
}

export function deleteMember(name: string) {
  setMembers(getMembers().filter((m) => m.name !== name));
  return { ok: true };
}

export type Payment = { name: string; amount: number; date: string };
export function getPayments(): Payment[] { return read<Payment[]>(PKEY, []); }
function setPayments(ps: Payment[]) { write(PKEY, ps); }

export function getClub(): Club | null { return read<Club | null>(CKEY, null); }
export function saveClub(name: string, goal: number) { write(CKEY, { name: name.trim(), goal }); return { ok: true }; }

export function isAuthed(): boolean { return read<string>(AKEY, "") === "1"; }
export function login() { write(AKEY, "1"); }
export function logout() { if (typeof window !== "undefined") localStorage.removeItem(AKEY); }
export function clearData() { if (typeof window !== "undefined") { localStorage.removeItem(MKEY); localStorage.removeItem(CKEY); localStorage.removeItem(PKEY); } }
