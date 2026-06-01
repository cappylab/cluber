export async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (res.status === 401) { window.location.href = "/login"; throw new Error("unauthorized"); }
  return res.json();
}

export type Member = {
  name: string; phone: string; student_id: string; fee: number; paid: boolean;
  joined_date: string; role: string; position: string | null;
};
