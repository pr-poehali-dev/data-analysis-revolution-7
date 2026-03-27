import { useState, useEffect } from "react";
import { Shield, Ban, CheckCircle, LogOut, Users, Crown, Flag, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import func2url from "../../backend/func2url.json";

const ADMIN_URL = func2url.admin;

interface User {
  user_id: number;
  username: string;
  is_admin: boolean;
  is_blocked: boolean;
  is_verified: boolean;
  block_reason: string | null;
  created_at: string;
  last_seen: string;
}

interface Report {
  id: number;
  reporter_id: number;
  reporter_name: string;
  target_user_id: number;
  target_name: string;
  reason: string;
  created_at: string;
  is_reviewed: boolean;
}

interface AdminProps {
  token: string;
  currentUserId: number;
  onLogout: () => void;
}

const Admin = ({ token, currentUserId, onLogout }: AdminProps) => {
  const [tab, setTab] = useState<"users" | "reports">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockReason, setBlockReason] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const headers = { "Content-Type": "application/json", "X-Session-Token": token };

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}?action=users`, { headers });
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  const loadReports = async () => {
    const res = await fetch(`${ADMIN_URL}?action=reports`, { headers });
    const data = await res.json();
    setReports(data.reports || []);
  };

  useEffect(() => { loadUsers(); loadReports(); }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleVerify = async (userId: number, value: boolean) => {
    setActionLoading(userId);
    const res = await fetch(`${ADMIN_URL}?action=verify-user`, {
      method: "POST", headers,
      body: JSON.stringify({ user_id: userId, value }),
    });
    if (res.ok) { showMessage(value ? "Верификация выдана" : "Верификация снята"); await loadUsers(); }
    setActionLoading(null);
  };

  const handleReviewReport = async (reportId: number) => {
    await fetch(`${ADMIN_URL}?action=review-report`, {
      method: "POST", headers,
      body: JSON.stringify({ report_id: reportId }),
    });
    await loadReports();
  };

  const handleBlock = async (userId: number) => {
    setActionLoading(userId);
    const res = await fetch(`${ADMIN_URL}?action=block`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: userId, reason: blockReason[userId] || "Нарушение правил" }),
    });
    if (res.ok) { showMessage("Пользователь заблокирован"); await loadUsers(); }
    setActionLoading(null);
  };

  const handleUnblock = async (userId: number) => {
    setActionLoading(userId);
    const res = await fetch(`${ADMIN_URL}?action=unblock`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: userId }),
    });
    if (res.ok) { showMessage("Пользователь разблокирован"); await loadUsers(); }
    setActionLoading(null);
  };

  const handleSetAdmin = async (userId: number, value: boolean) => {
    setActionLoading(userId);
    const res = await fetch(`${ADMIN_URL}?action=set-admin`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: userId, is_admin: value }),
    });
    if (res.ok) { showMessage(value ? "Права админа выданы" : "Права админа сняты"); await loadUsers(); }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-[#36393f] text-white">
      {/* Шапка */}
      <div className="bg-[#2f3136] border-b border-[#202225] px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#ed4245] rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold">Панель администратора</h1>
            <p className="text-[#b9bbbe] text-xs">Управление пользователями Связь</p>
          </div>
        </div>
        <Button
          onClick={onLogout}
          variant="ghost"
          className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Уведомление */}
        {message && (
          <div className="mb-4 bg-[#3ba55c]/20 border border-[#3ba55c]/40 rounded-lg p-3 text-[#3ba55c] text-sm">
            {message}
          </div>
        )}

        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-[#2f3136] p-1 rounded-lg w-fit">
          <button onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${tab === "users" ? "bg-[#5865f2] text-white" : "text-[#b9bbbe] hover:text-white"}`}>
            <Users className="w-4 h-4" /> Пользователи
          </button>
          <button onClick={() => setTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${tab === "reports" ? "bg-[#ed4245] text-white" : "text-[#b9bbbe] hover:text-white"}`}>
            <Flag className="w-4 h-4" /> Жалобы
            {reports.filter(r => !r.is_reviewed).length > 0 && (
              <span className="bg-[#ed4245] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {reports.filter(r => !r.is_reviewed).length}
              </span>
            )}
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Всего", value: users.length, color: "text-white" },
            { label: "В сети", value: users.filter(u => !u.is_blocked).length, color: "text-[#3ba55c]" },
            { label: "Заблокированы", value: users.filter(u => u.is_blocked).length, color: "text-[#ed4245]" },
            { label: "Администраторы", value: users.filter(u => u.is_admin).length, color: "text-[#faa61a]" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#2f3136] rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[#b9bbbe] text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Жалобы */}
        {tab === "reports" && (
          <div className="bg-[#2f3136] rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b border-[#202225] flex items-center gap-2">
              <Flag className="w-5 h-5 text-[#ed4245]" />
              <h2 className="text-white font-semibold">Жалобы пользователей</h2>
            </div>
            <div className="divide-y divide-[#202225]">
              {reports.length === 0 && <div className="p-8 text-center text-[#b9bbbe]">Жалоб нет</div>}
              {reports.map(r => (
                <div key={r.id} className={`p-4 ${r.is_reviewed ? "opacity-50" : ""}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[#b9bbbe] text-xs">от</span>
                        <span className="text-white text-sm font-medium">{r.reporter_name}</span>
                        <span className="text-[#b9bbbe] text-xs">на</span>
                        <span className="text-[#ed4245] text-sm font-medium">{r.target_name || `ID:${r.target_user_id}`}</span>
                        {r.is_reviewed && <span className="text-[#3ba55c] text-xs">· рассмотрено</span>}
                      </div>
                      <p className="text-[#dcddde] text-sm mb-1">{r.reason}</p>
                      <span className="text-[#72767d] text-xs">{new Date(r.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                    {!r.is_reviewed && (
                      <Button size="sm" onClick={() => handleReviewReport(r.id)}
                        className="bg-[#3ba55c] hover:bg-[#2d7d46] text-white h-8 text-xs flex-shrink-0">
                        <CheckCircle className="w-3 h-3 mr-1" /> Рассмотрено
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Таблица пользователей */}
        {tab === "users" && <div className="bg-[#2f3136] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#202225] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#5865f2]" />
            <h2 className="text-white font-semibold">Пользователи</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[#b9bbbe]">Загрузка...</div>
          ) : (
            <div className="divide-y divide-[#202225]">
              {users.map((user) => (
                <div key={user.user_id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Аватар + инфо */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.is_blocked ? "bg-[#ed4245]/20" : "bg-[#5865f2]"
                      }`}>
                        <span className="text-white font-bold text-sm">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium">{user.username}</span>
                          {user.is_admin && (
                            <span className="bg-[#faa61a]/20 text-[#faa61a] text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Crown className="w-3 h-3" /> Админ
                            </span>
                          )}
                          {user.is_verified && (
                            <span className="bg-[#3ba55c]/20 text-[#3ba55c] text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Верифицирован
                            </span>
                          )}
                          {user.is_blocked && (
                            <span className="bg-[#ed4245]/20 text-[#ed4245] text-xs px-1.5 py-0.5 rounded">
                              Заблокирован
                            </span>
                          )}
                          {user.user_id === currentUserId && (
                            <span className="bg-[#5865f2]/20 text-[#5865f2] text-xs px-1.5 py-0.5 rounded">Вы</span>
                          )}
                        </div>
                        <div className="text-[#b9bbbe] text-xs">
                          ID: {user.user_id}
                          {user.block_reason && (
                            <span className="text-[#ed4245] ml-2">· {user.block_reason}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Действия — только не для себя */}
                    {user.user_id !== currentUserId && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        {!user.is_blocked && (
                          <Input
                            value={blockReason[user.user_id] || ""}
                            onChange={(e) => setBlockReason(prev => ({ ...prev, [user.user_id]: e.target.value }))}
                            placeholder="Причина блокировки..."
                            className="bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] text-xs h-8 w-full sm:w-48"
                          />
                        )}
                        {user.is_blocked ? (
                          <Button
                            onClick={() => handleUnblock(user.user_id)}
                            disabled={actionLoading === user.user_id}
                            size="sm"
                            className="bg-[#3ba55c] hover:bg-[#2d7d46] text-white h-8 text-xs"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Разблокировать
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleBlock(user.user_id)}
                            disabled={actionLoading === user.user_id}
                            size="sm"
                            className="bg-[#ed4245] hover:bg-[#c03537] text-white h-8 text-xs"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Заблокировать
                          </Button>
                        )}
                        <Button
                          onClick={() => handleSetAdmin(user.user_id, !user.is_admin)}
                          disabled={actionLoading === user.user_id}
                          size="sm"
                          variant="outline"
                          className="border-[#4f545c] text-[#b9bbbe] hover:bg-[#40444b] h-8 text-xs bg-transparent"
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          {user.is_admin ? "Снять админа" : "Сделать админом"}
                        </Button>
                        <Button
                          onClick={() => handleVerify(user.user_id, !user.is_verified)}
                          disabled={actionLoading === user.user_id}
                          size="sm"
                          variant="outline"
                          className={`h-8 text-xs bg-transparent border-[#4f545c] hover:bg-[#40444b] ${user.is_verified ? "text-[#3ba55c]" : "text-[#b9bbbe]"}`}
                        >
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          {user.is_verified ? "Снять галочку" : "Верифицировать"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="p-8 text-center text-[#b9bbbe]">Пользователей пока нет</div>
              )}
            </div>
          )}
        </div>}
      </div>
    </div>
  );
};

export default Admin;