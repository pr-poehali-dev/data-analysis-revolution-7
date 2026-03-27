import { useNavigate } from "react-router-dom";
import {
  Hash, Users, Settings, Plus, Send,
  MessageCircle, Crown, ArrowLeft, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserData, Group, Message, avatarColor, formatTime } from "./types";

interface Props {
  user: UserData;
  activeGroup: Group | null;
  messages: Message[];
  inputText: string;
  sending: boolean;
  showMembers: boolean;
  canEditGroup: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onBackToSidebar: () => void;
  onOpenCreateModal: () => void;
  onOpenProfile: (userId: number) => void;
  onOpenGroupSettings: () => void;
  onToggleMembers: () => void;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

const ChatArea = ({
  user,
  activeGroup,
  messages,
  inputText,
  sending,
  showMembers,
  canEditGroup,
  messagesEndRef,
  onBackToSidebar,
  onOpenCreateModal,
  onOpenProfile,
  onOpenGroupSettings,
  onToggleMembers,
  onInputChange,
  onSendMessage,
}: Props) => {
  const navigate = useNavigate();

  if (!activeGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative">
        <button onClick={onBackToSidebar} className="lg:hidden absolute top-4 left-4 text-[#b9bbbe] hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-20 h-20 bg-[#5865f2]/20 rounded-full flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10 text-[#5865f2]" />
        </div>
        <h2 className="text-white font-bold text-2xl mb-2">Добро пожаловать, {user.username}!</h2>
        <p className="text-[#b9bbbe] text-sm mb-6 max-w-sm">
          Выбери группу из списка или создай новую, чтобы начать общение.
        </p>
        <Button onClick={onOpenCreateModal} className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-3">
          <Plus className="w-4 h-4 mr-2" />
          Создать группу
        </Button>
        <button onClick={() => navigate("/")} className="mt-4 text-[#b9bbbe] hover:text-white text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок чата */}
      <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-2 flex-shrink-0">
        <button
          onClick={onBackToSidebar}
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
              onClick={onOpenGroupSettings}
              className="p-1.5 rounded hover:bg-[#40444b] hover:text-[#dcddde] transition-colors"
              title="Настройки группы"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggleMembers}
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
                  onClick={() => onOpenProfile(msg.user_id)}
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
                      onClick={() => onOpenProfile(msg.user_id)}
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
        <form onSubmit={onSendMessage} className="flex gap-2">
          <div className="flex-1 bg-[#40444b] rounded-lg flex items-center px-4">
            <input
              type="text"
              value={inputText}
              onChange={e => onInputChange(e.target.value)}
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
    </div>
  );
};

export default ChatArea;
