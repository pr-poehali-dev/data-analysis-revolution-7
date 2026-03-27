import { useState, useEffect } from "react";
import { Crown, CheckCircle, Shield } from "lucide-react";
import func2url from "../../backend/func2url.json";

const GROUPS_URL = func2url.groups;

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

interface Member {
  user_id: number;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  joined_at: string;
}

interface Props {
  groupId: number;
  ownerId: number;
  token: string;
  onOpenProfile: (userId: number) => void;
}

const MembersSidebar = ({ groupId, ownerId, token, onOpenProfile }: Props) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${GROUPS_URL}?action=members&group_id=${groupId}`, {
      headers: { "Content-Type": "application/json", "X-Session-Token": token },
    })
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .finally(() => setLoading(false));
  }, [groupId]);

  const owner = members.find(m => m.user_id === ownerId);
  const others = members.filter(m => m.user_id !== ownerId);

  return (
    <div className="w-60 bg-[#2f3136] flex flex-col h-full border-l border-[#202225] flex-shrink-0">
      <div className="h-12 px-4 flex items-center border-b border-[#202225] flex-shrink-0">
        <span className="text-white font-semibold text-sm">Участники — {members.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading ? (
          <div className="text-[#72767d] text-xs text-center py-6">Загрузка...</div>
        ) : (
          <>
            {owner && (
              <div className="mb-3">
                <div className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide px-1 mb-1.5">
                  Владелец
                </div>
                <MemberRow member={owner} isOwner onOpenProfile={onOpenProfile} />
              </div>
            )}

            {others.length > 0 && (
              <div>
                <div className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide px-1 mb-1.5">
                  Участники — {others.length}
                </div>
                {others.map(m => (
                  <MemberRow key={m.user_id} member={m} onOpenProfile={onOpenProfile} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const MemberRow = ({
  member,
  isOwner = false,
  onOpenProfile,
}: {
  member: Member;
  isOwner?: boolean;
  onOpenProfile: (userId: number) => void;
}) => (
  <button
    onClick={() => onOpenProfile(member.user_id)}
    className="w-full flex items-center gap-2 px-1 py-1.5 rounded hover:bg-[#34373c] group text-left"
  >
    <div className="relative flex-shrink-0">
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.username}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className={`w-8 h-8 bg-gradient-to-br ${avatarColor(member.username)} rounded-full flex items-center justify-center`}>
          <span className="text-white text-xs font-bold">{member.username[0].toUpperCase()}</span>
        </div>
      )}
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#2f3136]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <span className={`text-sm truncate font-medium group-hover:text-white transition-colors ${isOwner ? "text-[#faa61a]" : "text-[#b9bbbe]"}`}>
          {member.username}
        </span>
        {isOwner && <Crown className="w-3 h-3 text-[#faa61a] flex-shrink-0" />}
        {member.is_verified && !isOwner && <CheckCircle className="w-3 h-3 text-[#3ba55c] flex-shrink-0" />}
      </div>
    </div>
  </button>
);

export default MembersSidebar;
