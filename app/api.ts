export async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (res.status === 401) { window.location.href = "/login"; throw new Error("unauthorized"); }
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `${res.status} ${res.statusText}` };
  }
}

export type Member = {
  name: string; phone: string; student_id: string; fee: number; paid: boolean;
  joined_date: string; role: string; position: string | null;
};
