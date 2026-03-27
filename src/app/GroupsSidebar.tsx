import { useNavigate } from "react-router-dom";
import {
  Hash, Settings, LogOut, Plus,
  MessageCircle, Crown, ChevronDown,
  CheckCircle, Shield, UserPlus,
} from "lucide-react";
import { UserData, Group, avatarColor } from "./types";

interface Props {
  user: UserData;
  groups: Group[];
  activeGroup: Group | null;
  onSelectGroup: (group: Group) => void;
  onOpenFriends: () => void;
  onOpenCreateModal: () => void;
  onOpenProfile: (userId: number) => void;
  onLogout: () => void;
}

const GroupsSidebar = ({
  user,
  groups,
  activeGroup,
  onSelectGroup,
  onOpenFriends,
  onOpenCreateModal,
  onOpenProfile,
  onLogout,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-[#2f3136]">
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225] shadow-sm flex-shrink-0">
        <span className="text-white font-semibold text-sm truncate">Мои группы</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFriends}
            className="text-[#b9bbbe] hover:text-white p-1 rounded hover:bg-[#40444b]"
            title="Друзья"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenCreateModal}
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
            <button onClick={onOpenCreateModal} className="text-[#5865f2] text-xs hover:underline mt-1">
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
              <button key={group.id} onClick={() => onSelectGroup(group)}
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
          onClick={() => onOpenProfile(user.user_id)}
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
          <button onClick={onLogout}
            className="w-8 h-8 flex items-center justify-center text-[#b9bbbe] hover:text-white hover:bg-[#40444b] rounded" title="Выйти">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupsSidebar;
