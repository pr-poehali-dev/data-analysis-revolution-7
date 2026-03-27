export interface UserData {
  token: string;
  user_id: number;
  username: string;
  is_admin: boolean;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  member_count: number;
  is_official: boolean;
  is_verified: boolean;
}

export interface Message {
  id: number;
  user_id: number;
  username: string;
  text: string;
  created_at: string;
}

export type View = "sidebar" | "chat" | "friends";

const COLORS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-purple-500",
  "from-yellow-500 to-orange-500",
];

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}
