import { useState } from "react";
import { MessageCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import func2url from "../../backend/func2url.json";

interface AuthProps {
  onLogin: (user: { token: string; user_id: number; username: string; is_admin: boolean }) => void;
}

const AUTH_URL = func2url.auth;

const Auth = ({ onLogin }: AuthProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Произошла ошибка");
        return;
      }
      localStorage.setItem("svyaz_token", data.token);
      localStorage.setItem("svyaz_user", JSON.stringify(data));
      onLogin(data);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#36393f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#5865f2] rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Связь</h1>
          <p className="text-[#b9bbbe] text-sm mt-1">Мессенджер, который работает в России</p>
        </div>

        {/* Карточка */}
        <div className="bg-[#2f3136] rounded-lg p-8">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            {mode === "login" ? "С возвращением!" : "Создать аккаунт"}
          </h2>
          <p className="text-[#b9bbbe] text-sm text-center mb-6">
            {mode === "login"
              ? "Рады снова видеть тебя!"
              : "Присоединяйся к Связи — общайся без ограничений"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">
                Логин
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="твой_логин"
                className="bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] focus:border-[#5865f2] focus:ring-[#5865f2]"
                required
                minLength={3}
                maxLength={32}
              />
            </div>

            <div>
              <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">
                Пароль
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] focus:border-[#5865f2] focus:ring-[#5865f2] pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#72767d] hover:text-[#b9bbbe]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "register" && (
                <p className="text-[#72767d] text-xs mt-1">Минимум 6 символов</p>
              )}
            </div>

            {error && (
              <div className="bg-[#ed4245]/10 border border-[#ed4245]/30 rounded p-3 text-[#ed4245] text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-3 rounded font-medium"
            >
              {loading
                ? "Загрузка..."
                : mode === "login"
                ? "Войти"
                : "Зарегистрироваться"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-[#72767d]">
            {mode === "login" ? (
              <>
                Нет аккаунта?{" "}
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className="text-[#5865f2] hover:underline"
                >
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-[#5865f2] hover:underline"
                >
                  Войти
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[#72767d] text-xs mt-4">
          Регистрируясь, вы соглашаетесь с правилами использования сервиса
        </p>
      </div>
    </div>
  );
};

export default Auth;
