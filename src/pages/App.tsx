import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, UserPlus } from "lucide-react";
import ProfileModal from "@/components/ProfileModal";
import FriendsPanel from "@/components/FriendsPanel";
import MembersSidebar from "@/components/MembersSidebar";
import GroupSettingsModal from "@/components/GroupSettingsModal";
import GroupsSidebar from "@/app/GroupsSidebar";
import ChatArea from "@/app/ChatArea";
import CreateGroupModal from "@/app/CreateGroupModal";
import { UserData, Group, Message, View } from "@/app/types";
import func2url from "../../backend/func2url.json";

const GROUPS_URL = func2url.groups;
const MESSAGES_URL = func2url.messages;

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

  const canEditGroup = !!(activeGroup && (activeGroup.owner_id === user.user_id || user.is_admin));

  const sidebarContent = (
    <GroupsSidebar
      user={user}
      groups={groups}
      activeGroup={activeGroup}
      onSelectGroup={selectGroup}
      onOpenFriends={openFriends}
      onOpenCreateModal={() => setShowCreateModal(true)}
      onOpenProfile={setProfileUserId}
      onLogout={logout}
    />
  );

  const chatContent = (
    <ChatArea
      user={user}
      activeGroup={activeGroup}
      messages={messages}
      inputText={inputText}
      sending={sending}
      showMembers={showMembers}
      canEditGroup={canEditGroup}
      messagesEndRef={messagesEndRef}
      onBackToSidebar={backToSidebar}
      onOpenCreateModal={() => setShowCreateModal(true)}
      onOpenProfile={setProfileUserId}
      onOpenGroupSettings={() => setShowGroupSettings(true)}
      onToggleMembers={() => setShowMembers(v => !v)}
      onInputChange={setInputText}
      onSendMessage={sendMessage}
    />
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
        <CreateGroupModal
          newGroupName={newGroupName}
          newGroupDesc={newGroupDesc}
          creating={creating}
          createError={createError}
          onChangeName={setNewGroupName}
          onChangeDesc={setNewGroupDesc}
          onSubmit={createGroup}
          onClose={() => setShowCreateModal(false)}
        />
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
          <div className="w-60 flex-shrink-0 overflow-hidden">
            {view === "friends" ? (
              <FriendsPanel user={user} onBack={() => setView(activeGroup ? "chat" : "sidebar")} onOpenProfile={setProfileUserId} />
            ) : (
              sidebarContent
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {chatContent}
          </div>
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
              {sidebarContent}
            </div>
          )}
          {view === "chat" && (
            <div className="w-full overflow-hidden">
              {chatContent}
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
