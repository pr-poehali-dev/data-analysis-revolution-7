import { useState, useEffect } from "react";
import { X, Shield, CheckCircle, Flag, Pencil, Save, Calendar } from "lucide-react";
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
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

interface ProfileData {
  user_id: number;
  username: string;
  bio: string | null;
  is_admin: boolean;
  is_verified: boolean;
  is_blocked: boolean;
  created_at: string;
}

interface Props {
  userId: number;
  currentUser: { user_id: number; username: string; token: string; is_admin: boolean };
  onClose: () => void;
}

const ProfileModal = ({ userId, currentUser, onClose }: Props) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwn = userId === currentUser.user_id;

  // Редактирование
  const [editing, setEditing] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Жалоба
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const headers = { "Content-Type": "application/json", "X-Session-Token": currentUser.token };

  useEffect(() => {
    fetch(`${PROFILE_URL}?action=get&user_id=${userId}`, { headers })
      .then(r => r.json())
      .then(d => { setProfile(d); setBioInput(d.bio || ""); })
      .finally(() => setLoading(false));
  }, [userId]);

  const saveBio = async () => {
    setSaving(true);
    await fetch(`${PROFILE_URL}?action=update`, {
      method: "POST", headers,
      body: JSON.stringify({ bio: bioInput }),
    });
    setProfile(prev => prev ? { ...prev, bio: bioInput || null } : prev);
    setEditing(false);
    setSaving(false);
  };

  const sendReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    await fetch(`${PROFILE_URL}?action=report`, {
      method: "POST", headers,
      body: JSON.stringify({ user_id: userId, reason: reportReason }),
    });
    setReportSent(true);
    setReporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#36393f] rounded-lg w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Баннер */}
        <div className={`h-20 bg-gradient-to-r ${profile ? avatarColor(profile.username) : "from-[#5865f2] to-[#7c3aed]"} relative`}>
          <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 rounded-full p-1">
            <X className="w-4 h-4" />
          </button>
          {/* Аватар */}
          <div className="absolute -bottom-8 left-4">
            <div className={`w-16 h-16 rounded-full border-4 border-[#36393f] bg-gradient-to-br ${profile ? avatarColor(profile.username) : "from-[#5865f2] to-[#7c3aed]"} flex items-center justify-center`}>
              <span className="text-white text-xl font-bold">
                {profile?.username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-10 px-4 pb-4">
          {loading ? (
            <div className="text-[#b9bbbe] text-sm py-4 text-center">Загрузка...</div>
          ) : profile ? (
            <>
              {/* Имя и значки */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-white font-bold text-lg">{profile.username}</span>
                {profile.is_admin && (
                  <span title="Администратор">
                    <Shield className="w-4 h-4 text-[#ed4245]" />
                  </span>
                )}
                {profile.is_verified && (
                  <span title="Верифицирован">
                    <CheckCircle className="w-4 h-4 text-[#3ba55c]" />
                  </span>
                )}
                {profile.is_blocked && (
                  <span className="text-xs bg-[#ed4245]/20 text-[#ed4245] px-1.5 py-0.5 rounded">заблокирован</span>
                )}
              </div>

              {/* Цифровой ID */}
              <div className="text-[#b9bbbe] text-xs mb-3">ID: {profile.user_id}</div>

              <div className="bg-[#2f3136] rounded-lg p-3 space-y-3">
                {/* Дата регистрации */}
                <div className="flex items-center gap-2 text-[#b9bbbe] text-xs">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Участник с {formatDate(profile.created_at)}</span>
                </div>

                {/* Bio */}
                <div>
                  <div className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-1.5">О себе</div>
                  {isOwn && editing ? (
                    <div className="space-y-2">
                      <textarea
                        value={bioInput}
                        onChange={e => setBioInput(e.target.value)}
                        maxLength={200}
                        rows={3}
                        placeholder="Расскажи о себе..."
                        className="w-full bg-[#40444b] border border-[#202225] rounded text-white text-sm p-2 outline-none focus:border-[#5865f2] resize-none placeholder:text-[#72767d]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveBio} disabled={saving}
                          className="bg-[#5865f2] hover:bg-[#4752c4] text-white h-7 text-xs px-3">
                          <Save className="w-3 h-3 mr-1" />
                          {saving ? "Сохранение..." : "Сохранить"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setBioInput(profile.bio || ""); }}
                          className="text-[#b9bbbe] hover:bg-[#40444b] h-7 text-xs px-3">
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="text-[#dcddde] text-sm flex-1">
                        {profile.bio || <span className="text-[#72767d] italic">Нет описания</span>}
                      </p>
                      {isOwn && (
                        <button onClick={() => setEditing(true)} className="text-[#72767d] hover:text-[#b9bbbe] flex-shrink-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Жалоба */}
              {!isOwn && (
                <div className="mt-3">
                  {reportSent ? (
                    <p className="text-[#3ba55c] text-xs text-center">✓ Жалоба отправлена на рассмотрение</p>
                  ) : showReport ? (
                    <div className="space-y-2">
                      <textarea
                        value={reportReason}
                        onChange={e => setReportReason(e.target.value)}
                        maxLength={500}
                        rows={2}
                        placeholder="Опишите причину жалобы..."
                        className="w-full bg-[#40444b] border border-[#202225] rounded text-white text-sm p-2 outline-none focus:border-[#ed4245] resize-none placeholder:text-[#72767d]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={sendReport} disabled={reporting || !reportReason.trim()}
                          className="bg-[#ed4245] hover:bg-[#c03537] text-white h-7 text-xs px-3">
                          {reporting ? "Отправка..." : "Отправить жалобу"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowReport(false)}
                          className="text-[#b9bbbe] hover:bg-[#40444b] h-7 text-xs px-3">
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowReport(true)}
                      className="flex items-center gap-1.5 text-[#72767d] hover:text-[#ed4245] text-xs transition-colors">
                      <Flag className="w-3.5 h-3.5" />
                      Пожаловаться
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-[#b9bbbe] text-sm py-4 text-center">Пользователь не найден</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
