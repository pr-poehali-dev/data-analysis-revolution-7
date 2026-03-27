import { useState, useEffect } from "react";
import { ArrowLeft, Search, UserPlus, UserCheck, UserX, CheckCircle, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import func2url from "../../backend/func2url.json";

const PROFILE_URL = func2url.profile;

const COLORS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-purple-500",
  "from-yellow-500 to-orange-500",
];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface UserData {
  token: string;
  user_id: number;
  username: string;
  is_admin: boolean;
}

interface FriendUser {
  user_id: number;
  username: string;
  avatar_url: string | null;
  is_verified?: boolean;
  friendship_status?: string | null;
  direction?: string | null;
  friendship_id?: number;
}

interface Props {
  user: UserData;
  onBack: () => void;
  onOpenProfile: (userId: number) => void;
}

type Tab = "friends" | "search" | "incoming";

const AvatarOrPhoto = ({ user, size = "sm" }: { user: { username: string; avatar_url: string | null }; size?: "sm" | "md" }) => {
  const cls = size === "md" ? "w-12 h-12 text-lg" : "w-9 h-9 text-sm";
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.username} className={`${cls} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${cls} bg-gradient-to-br ${avatarColor(user.username)} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {user.username[0].toUpperCase()}
    </div>
  );
};

const FriendsPanel = ({ user, onBack, onOpenProfile }: Props) => {
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const headers = { "Content-Type": "application/json", "X-Session-Token": user.token };

  const loadFriends = async () => {
    setLoading(true);
    const res = await fetch(`${PROFILE_URL}?action=friends_list`, { headers });
    if (res.ok) { const d = await res.json(); setFriends(d.friends || []); }
    setLoading(false);
  };

  const loadIncoming = async () => {
    const res = await fetch(`${PROFILE_URL}?action=friends_incoming`, { headers });
    if (res.ok) { const d = await res.json(); setIncoming(d.incoming || []); }
  };

  useEffect(() => {
    loadFriends();
    loadIncoming();
  }, []);

  useEffect(() => {
    if (tab === "friends") loadFriends();
    if (tab === "incoming") loadIncoming();
  }, [tab]);

  const doSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    const res = await fetch(`${PROFILE_URL}?action=friends_search&q=${encodeURIComponent(searchQuery.trim())}`, { headers });
    if (res.ok) { const d = await res.json(); setSearchResults(d.users || []); }
    setSearching(false);
  };

  const sendRequest = async (targetId: number) => {
    setActionLoading(targetId);
    await fetch(`${PROFILE_URL}?action=friends_request`, {
      method: "POST", headers,
      body: JSON.stringify({ user_id: targetId }),
    });
    setSearchResults(prev => prev.map(u => u.user_id === targetId ? { ...u, friendship_status: "pending", direction: "sent" } : u));
    setActionLoading(null);
  };

  const acceptRequest = async (friendshipId: number, userId: number) => {
    setActionLoading(userId);
    await fetch(`${PROFILE_URL}?action=friends_accept`, {
      method: "POST", headers,
      body: JSON.stringify({ friendship_id: friendshipId }),
    });
    await loadFriends();
    await loadIncoming();
    setActionLoading(null);
  };

  const declineRequest = async (friendshipId: number, userId: number) => {
    setActionLoading(userId);
    await fetch(`${PROFILE_URL}?action=friends_decline`, {
      method: "POST", headers,
      body: JSON.stringify({ friendship_id: friendshipId }),
    });
    setIncoming(prev => prev.filter(u => u.user_id !== userId));
    setActionLoading(null);
  };

  const removeFriend = async (targetId: number) => {
    setActionLoading(targetId);
    await fetch(`${PROFILE_URL}?action=friends_remove`, {
      method: "POST", headers,
      body: JSON.stringify({ user_id: targetId }),
    });
    setFriends(prev => prev.filter(u => u.user_id !== targetId));
    setActionLoading(null);
  };

  const getFriendshipButton = (u: FriendUser) => {
    const status = u.friendship_status;
    const dir = u.direction;
    if (status === "accepted") {
      return (
        <button
          onClick={() => removeFriend(u.user_id)}
          disabled={actionLoading === u.user_id}
          className="text-[#ed4245] hover:bg-[#ed4245]/10 p-1.5 rounded transition-colors"
          title="Удалить из друзей"
        >
          <UserX className="w-4 h-4" />
        </button>
      );
    }
    if (status === "pending" && dir === "sent") {
      return (
        <span className="text-[#72767d] flex items-center gap-1 text-xs">
          <Clock className="w-3.5 h-3.5" /> Ожидание
        </span>
      );
    }
    if (status === "pending" && dir === "received") {
      return (
        <div className="flex gap-1">
          <button
            onClick={async () => {
              const found = incoming.find(i => i.user_id === u.user_id);
              if (found?.friendship_id) await acceptRequest(found.friendship_id, u.user_id);
            }}
            disabled={actionLoading === u.user_id}
            className="text-[#3ba55c] hover:bg-[#3ba55c]/10 p-1.5 rounded transition-colors"
            title="Принять"
          >
            <UserCheck className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              const found = incoming.find(i => i.user_id === u.user_id);
              if (found?.friendship_id) await declineRequest(found.friendship_id, u.user_id);
            }}
            disabled={actionLoading === u.user_id}
            className="text-[#ed4245] hover:bg-[#ed4245]/10 p-1.5 rounded transition-colors"
            title="Отклонить"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => sendRequest(u.user_id)}
        disabled={actionLoading === u.user_id}
        className="text-[#3ba55c] hover:bg-[#3ba55c]/10 p-1.5 rounded transition-colors"
        title="Добавить в друзья"
      >
        <UserPlus className="w-4 h-4" />
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#2f3136]">
      {/* Заголовок */}
      <div className="h-12 px-4 flex items-center gap-3 border-b border-[#202225] flex-shrink-0">
        <button onClick={onBack} className="text-[#b9bbbe] hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-white font-semibold text-sm">Друзья</span>
      </div>

      {/* Вкладки */}
      <div className="flex border-b border-[#202225] px-2 pt-2 flex-shrink-0">
        {(["friends", "incoming", "search"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors relative ${
              tab === t ? "text-white" : "text-[#8e9297] hover:text-[#dcddde]"
            }`}
          >
            {t === "friends" && "Друзья"}
            {t === "incoming" && (
              <span className="flex items-center gap-1">
                Заявки
                {incoming.length > 0 && (
                  <span className="bg-[#ed4245] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {incoming.length}
                  </span>
                )}
              </span>
            )}
            {t === "search" && "Поиск"}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865f2] rounded-t" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">

        {/* Список друзей */}
        {tab === "friends" && (
          <>
            {loading ? (
              <div className="text-[#72767d] text-xs text-center py-8">Загрузка...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-8 h-8 text-[#4f545c] mx-auto mb-2" />
                <p className="text-[#72767d] text-xs">Пока нет друзей</p>
                <button onClick={() => setTab("search")} className="text-[#5865f2] text-xs hover:underline mt-1">
                  Найти людей
                </button>
              </div>
            ) : (
              <>
                <div className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide px-2 py-1 mb-1">
                  Друзья — {friends.length}
                </div>
                {friends.map(f => (
                  <div key={f.user_id} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-[#34373c] group">
                    <button onClick={() => onOpenProfile(f.user_id)} className="hover:opacity-80">
                      <AvatarOrPhoto user={f} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => onOpenProfile(f.user_id)} className="flex items-center gap-1 hover:underline">
                        <span className="text-white text-sm font-medium truncate">{f.username}</span>
                        {f.is_verified && <CheckCircle className="w-3 h-3 text-[#3ba55c] flex-shrink-0" />}
                      </button>
                    </div>
                    <button
                      onClick={() => removeFriend(f.user_id)}
                      disabled={actionLoading === f.user_id}
                      className="opacity-0 group-hover:opacity-100 text-[#ed4245] hover:bg-[#ed4245]/10 p-1.5 rounded transition-all"
                      title="Удалить из друзей"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* Входящие заявки */}
        {tab === "incoming" && (
          <>
            {incoming.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-8 h-8 text-[#4f545c] mx-auto mb-2" />
                <p className="text-[#72767d] text-xs">Нет входящих заявок</p>
              </div>
            ) : (
              <>
                <div className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide px-2 py-1 mb-1">
                  Ожидают — {incoming.length}
                </div>
                {incoming.map(f => (
                  <div key={f.user_id} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-[#34373c]">
                    <button onClick={() => onOpenProfile(f.user_id)} className="hover:opacity-80">
                      <AvatarOrPhoto user={f} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => onOpenProfile(f.user_id)} className="hover:underline text-left">
                        <span className="text-white text-sm font-medium truncate">{f.username}</span>
                      </button>
                      <p className="text-[#72767d] text-xs">хочет добавить вас в друзья</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => f.friendship_id && acceptRequest(f.friendship_id, f.user_id)}
                        disabled={actionLoading === f.user_id}
                        className="bg-[#3ba55c] hover:bg-[#2d7d46] text-white p-1.5 rounded transition-colors"
                        title="Принять"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => f.friendship_id && declineRequest(f.friendship_id, f.user_id)}
                        disabled={actionLoading === f.user_id}
                        className="bg-[#4f545c] hover:bg-[#5d6269] text-white p-1.5 rounded transition-colors"
                        title="Отклонить"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* Поиск */}
        {tab === "search" && (
          <div className="space-y-3">
            <div className="flex gap-2 px-1">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#72767d]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="Поиск по имени..."
                  className="w-full bg-[#40444b] text-white text-sm pl-9 pr-3 py-2 rounded outline-none placeholder:text-[#72767d] focus:ring-1 focus:ring-[#5865f2]"
                />
              </div>
              <Button
                onClick={doSearch}
                disabled={searching || searchQuery.trim().length < 2}
                size="sm"
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-3"
              >
                {searching ? "..." : "Найти"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <>
                <div className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide px-2">
                  Результаты — {searchResults.length}
                </div>
                {searchResults.map(u => (
                  <div key={u.user_id} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-[#34373c]">
                    <button onClick={() => onOpenProfile(u.user_id)} className="hover:opacity-80">
                      <AvatarOrPhoto user={u} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => onOpenProfile(u.user_id)} className="flex items-center gap-1 hover:underline">
                        <span className="text-white text-sm font-medium truncate">{u.username}</span>
                        {u.is_verified && <CheckCircle className="w-3 h-3 text-[#3ba55c] flex-shrink-0" />}
                      </button>
                    </div>
                    <div className="flex-shrink-0">
                      {getFriendshipButton(u)}
                    </div>
                  </div>
                ))}
              </>
            )}

            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <p className="text-[#72767d] text-xs text-center py-4">Никого не найдено</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPanel;
