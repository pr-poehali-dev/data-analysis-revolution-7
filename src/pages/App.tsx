import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hash, Users, Settings, LogOut, Plus, Send,
  MessageCircle, Crown, ChevronDown, ArrowLeft,
  CheckCircle, Shield, UserPlus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileModal from "@/components/ProfileModal";
import FriendsPanel from "@/components/FriendsPanel";
import MembersSidebar from "@/components/MembersSidebar";
import GroupSettingsModal from "@/components/GroupSettingsModal";
import func2url from "../../backend/func2url.json";

const GROUPS_URL = func2url.groups;
const MESSAGES_URL = func2url.messages;

interface UserData {
  token: string;
  user_id: number;
  username: string;
  is_admin: boolean;
}

interface Group {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  member_count: number;
  is_official: boolean;
  is_verified: boolean;
}

interface Message {
  id: number;
  user_id: number;
  username: string;
  text: string;
  created_at: string;
}

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

type View = "sidebar" | "chat" | "friends";

const AppPage = () => {
  const navigate = useNavigate();
  const user: UserData | null = (() => {
    try { return JSON.parse(localStorage.getItem("svyaz_user") || "null"); } catch { return null; }
  })();

  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Мобильная навигация: показываем sidebar ИЛИ chat ИЛИ friends
  const [view, setView] = useState<View>("sidebar");

  // Создание группы
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Профиль
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  // Правая панель участников
  const [showMembers, setShowMembers] = useState(false);

  // Настройки группы
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = { "Content-Type": "application/json", "X-Session-Token": user?.token || "" };

  const logout = () => {
    localStorage.removeItem("svyaz_user");
    localStorage.removeItem("svyaz_token");
    navigate("/");
  };

  const loadGroups = async () => {
    const res = await fetch(`${GROUPS_URL}?action=list`, { headers });
    if (res.ok) { const data = await res.json(); setGroups(data.groups || []); }
  };

  const loadMessages = async (groupId: number) => {
    const res = await fetch(`${MESSAGES_URL}?action=list&group_id=${groupId}`, { headers });
    if (res.ok) { const data = await res.json(); setMessages(data.messages || []); }
  };

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadGroups();
  }, []);

  useEffect(() => {
    if (!activeGroup) return;
    loadMessages(activeGroup.id);
    pollRef.current = setInterval(() => loadMessages(activeGroup.id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectGroup = (group: Group) => {
    setActiveGroup(group);
    setShowGroupSettings(false);
    setView("chat");
  };

  const openFriends = () => setView("friends");
  const backToSidebar = () => setView("sidebar");

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeGroup || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText("");
    const res = await fetch(`${MESSAGES_URL}?action=send`, {
      method: "POST", headers,
      body: JSON.stringify({ group_id: activeGroup.id, text }),
    });
    if (res.ok) { const msg = await res.json(); setMessages(prev => [...prev, msg]); }
    setSending(false);
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!newGroupName.trim()) return;
    setCreating(true);
    const res = await fetch(`${GROUPS_URL}?action=create`, {
      method: "POST", headers,
      body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDesc.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error || "Ошибка"); setCreating(false); return; }
    setShowCreateModal(false);
    setNewGroupName(""); setNewGroupDesc(""); setCreating(false);
    await loadGroups();
    const newGroup: Group = { id: data.id, name: data.name, description: newGroupDesc, owner_id: user!.user_id, member_count: 1, is_official: false, is_verified: false };
    selectGroup(newGroup);
  };

  if (!user) return null;

  const canEditGroup = activeGroup && (activeGroup.owner_id === user.user_id || user.is_admin);

  // Sidebar JSX
  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#2f3136]">
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225] shadow-sm flex-shrink-0">
        <span className="text-white font-semibold text-sm truncate">Мои группы</span>
        <div className="flex items-center gap-1">
          <button
            onClick={openFriends}
            className="text-[#b9bbbe] hover:text-white p-1 rounded hover:bg-[#40444b]"
            title="Друзья"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-[#b9bbbe] hover:text-white p-1 rounded hover:bg-[#40444b]"
            title="Создать группу"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <MessageCircle className="w-8 h-8 text-[#4f545c] mx-auto mb-2" />
            <p className="text-[#72767d] text-xs">Нет групп</p>
            <button onClick={() => setShowCreateModal(true)} className="text-[#5865f2] text-xs hover:underline mt-1">
              Создать первую
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-1">
              <ChevronDown className="w-3 h-3" />
              <span>Группы — {groups.length}</span>
            </div>
            {groups.map(group => (
              <button key={group.id} onClick={() => selectGroup(group)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  activeGroup?.id === group.id ? "bg-[#393c43] text-white" : "text-[#8e9297] hover:text-[#dcddde] hover:bg-[#34373c]"
                }`}>
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1 text-left">{group.name}</span>
                <span className="flex items-center gap-0.5 flex-shrink-0">
                  {group.is_official && <Crown className="w-3 h-3 text-[#faa61a]" title="Официальная группа" />}
                  {group.is_verified && <CheckCircle className="w-3 h-3 text-[#3ba55c]" title="Верифицирована" />}
                  {!group.is_official && !group.is_verified && group.owner_id === user.user_id && (
                    <Crown className="w-3 h-3 text-[#72767d]" title="Вы владелец" />
                  )}
                </span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Пользователь внизу */}
      <div className="p-2 bg-[#292b2f] flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setProfileUserId(user.user_id)}
          className={`w-8 h-8 bg-gradient-to-r ${avatarColor(user.username)} rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity`}
          title="Мой профиль"
        >
          <span className="text-white text-sm font-bold">{user.username[0].toUpperCase()}</span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-white text-sm font-medium truncate">{user.username}</span>
            {user.is_admin && <Shield className="w-3 h-3 text-[#ed4245] flex-shrink-0" title="Администратор" />}
          </div>
          <div className="text-[#b9bbbe] text-xs">#{user.user_id}</div>
        </div>
        <div className="flex gap-1">
          {user.is_admin && (
            <button onClick={() => navigate("/admin")}
              className="w-8 h-8 flex items-center justify-center text-[#faa61a] hover:bg-[#40444b] rounded" title="Админка">
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button onClick={logout}
            className="w-8 h-8 flex items-center justify-center text-[#b9bbbe] hover:text-white hover:bg-[#40444b] rounded" title="Выйти">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Chat JSX
  const ChatContent = (
    <div className="flex flex-col h-full">
      {activeGroup ? (
        <>
          {/* Заголовок чата */}
          <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-2 flex-shrink-0">
            <button
              onClick={backToSidebar}
              className="lg:hidden text-[#8e9297] hover:text-[#dcddde] mr-1 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Hash className="w-5 h-5 text-[#8e9297] flex-shrink-0" />
            <span className="text-white font-semibold truncate">{activeGroup.name}</span>
            {activeGroup.is_official && <Crown className="w-4 h-4 text-[#faa61a] flex-shrink-0" title="Официальная" />}
            {activeGroup.is_verified && <CheckCircle className="w-4 h-4 text-[#3ba55c] flex-shrink-0" title="Верифицирована" />}
            {activeGroup.description && (
              <>
                <div className="w-px h-5 bg-[#40444b] mx-2 hidden sm:block flex-shrink-0" />
                <span className="text-[#8e9297] text-sm hidden sm:block truncate">{activeGroup.description}</span>
              </>
            )}
            <div className="ml-auto flex items-center gap-1 text-[#b9bbbe] flex-shrink-0">
              {canEditGroup && (
                <button
                  onClick={() => setShowGroupSettings(true)}
                  className="p-1.5 rounded hover:bg-[#40444b] hover:text-[#dcddde] transition-colors"
                  title="Настройки группы"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowMembers(v => !v)}
                className={`p-1.5 rounded hover:bg-[#40444b] transition-colors ${showMembers ? "text-white bg-[#40444b]" : "hover:text-[#dcddde]"}`}
                title="Участники"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 bg-[#5865f2]/20 rounded-full flex items-center justify-center mb-4">
                  <Hash className="w-8 h-8 text-[#5865f2]" />
                </div>
                <h3 className="text-white font-bold text-xl mb-1">Начало #{activeGroup.name}</h3>
                <p className="text-[#b9bbbe] text-sm">Напиши первое сообщение в группе!</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isOwn = msg.user_id === user.user_id;
              const prevMsg = messages[i - 1];
              const grouped = prevMsg && prevMsg.user_id === msg.user_id &&
                (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 5 * 60 * 1000;
              return (
                <div key={msg.id} className={`flex gap-3 group ${grouped ? "mt-0.5" : "mt-4"}`}>
                  {!grouped ? (
                    <button
                      onClick={() => setProfileUserId(msg.user_id)}
                      className={`w-10 h-10 bg-gradient-to-r ${avatarColor(msg.username)} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 hover:opacity-80 transition-opacity cursor-pointer`}
                    >
                      <span className="text-white text-sm font-bold">{msg.username[0].toUpperCase()}</span>
                    </button>
                  ) : (
                    <div className="w-10 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {!grouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <button
                          onClick={() => setProfileUserId(msg.user_id)}
                          className={`font-medium text-sm hover:underline cursor-pointer ${isOwn ? "text-[#5865f2]" : "text-white"}`}
                        >
                          {msg.username}
                        </button>
                        <span className="text-[#72767d] text-xs">{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    <p className="text-[#dcddde] text-sm leading-relaxed break-words">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="p-4 flex-shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2">
              <div className="flex-1 bg-[#40444b] rounded-lg flex items-center px-4">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={`Сообщение #${activeGroup.name}`}
                  maxLength={2000}
                  className="flex-1 bg-transparent text-[#dcddde] placeholder:text-[#72767d] text-sm py-3 outline-none"
                />
              </div>
              <Button type="submit" disabled={!inputText.trim() || sending}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white w-11 h-11 p-0 flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative">
          <button onClick={backToSidebar} className="lg:hidden absolute top-4 left-4 text-[#b9bbbe] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-20 h-20 bg-[#5865f2]/20 rounded-full flex items-center justify-center mb-6">
            <MessageCircle className="w-10 h-10 text-[#5865f2]" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2">Добро пожаловать, {user.username}!</h2>
          <p className="text-[#b9bbbe] text-sm mb-6 max-w-sm">
            Выбери группу из списка или создай новую, чтобы начать общение.
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-3">
            <Plus className="w-4 h-4 mr-2" />
            Создать группу
          </Button>
          <button onClick={() => navigate("/")} className="mt-4 text-[#b9bbbe] hover:text-white text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-[#36393f] text-white flex flex-col overflow-hidden">

      {/* Модал профиля */}
      {profileUserId !== null && (
        <ProfileModal
          userId={profileUserId}
          currentUser={user}
          onClose={() => setProfileUserId(null)}
        />
      )}

      {/* Настройки группы */}
      {showGroupSettings && activeGroup && (
        <GroupSettingsModal
          group={activeGroup}
          token={user.token}
          isAdmin={user.is_admin}
          onClose={() => setShowGroupSettings(false)}
          onUpdated={(name, description) => {
            setActiveGroup(prev => prev ? { ...prev, name, description } : prev);
            loadGroups();
          }}
          onDeleted={() => {
            setActiveGroup(null);
            setMessages([]);
            setShowGroupSettings(false);
            setShowMembers(false);
            setView("sidebar");
            loadGroups();
          }}
        />
      )}

      {/* Модал создания группы */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#36393f] rounded-lg w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-[#202225] flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Создать группу</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#b9bbbe] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">Название группы</label>
                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Моя группа" maxLength={64} autoFocus
                  className="bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] focus:border-[#5865f2]" />
              </div>
              <div>
                <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">
                  Описание <span className="text-[#72767d] normal-case font-normal">(необязательно)</span>
                </label>
                <Input value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
                  placeholder="О чём эта группа?" maxLength={200}
                  className="bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] focus:border-[#5865f2]" />
              </div>
              {createError && <p className="text-[#ed4245] text-sm">{createError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}
                  className="flex-1 text-[#b9bbbe] hover:bg-[#40444b]">Отмена</Button>
                <Button type="submit" disabled={creating || !newGroupName.trim()}
                  className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white">
                  {creating ? "Создание..." : "Создать"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Сайдбар серверов — только desktop */}
        <div className="hidden lg:flex w-[72px] bg-[#202225] flex-col items-center py-3 gap-2 flex-shrink-0">
          <div className="w-12 h-12 bg-[#5865f2] rounded-2xl flex items-center justify-center cursor-pointer">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="w-8 h-[2px] bg-[#36393f] rounded-full" />
          <button onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 bg-[#36393f] hover:bg-[#3ba55c] rounded-3xl hover:rounded-xl transition-all duration-200 flex items-center justify-center text-[#3ba55c] hover:text-white"
            title="Создать группу">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={openFriends}
            className="w-12 h-12 bg-[#36393f] hover:bg-[#5865f2] rounded-3xl hover:rounded-xl transition-all duration-200 flex items-center justify-center text-[#b9bbbe] hover:text-white"
            title="Друзья">
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop: sidebar + chat + members рядом */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-60 flex-shrink-0 overflow-hidden">
            {view === "friends" ? (
              <FriendsPanel user={user} onBack={() => setView(activeGroup ? "chat" : "sidebar")} onOpenProfile={setProfileUserId} />
            ) : (
              SidebarContent
            )}
          </div>
          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            {ChatContent}
          </div>
          {/* Members — правая панель */}
          {showMembers && activeGroup && (
            <MembersSidebar
              groupId={activeGroup.id}
              ownerId={activeGroup.owner_id}
              token={user.token}
              onOpenProfile={setProfileUserId}
            />
          )}
        </div>

        {/* Mobile: один экран за раз */}
        <div className="flex lg:hidden flex-1 overflow-hidden">
          {view === "sidebar" && (
            <div className="w-full overflow-hidden">
              {SidebarContent}
            </div>
          )}
          {view === "chat" && (
            <div className="w-full overflow-hidden">
              {ChatContent}
            </div>
          )}
          {view === "friends" && (
            <div className="w-full overflow-hidden">
              <FriendsPanel user={user} onBack={() => setView("sidebar")} onOpenProfile={setProfileUserId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppPage;