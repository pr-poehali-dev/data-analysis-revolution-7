import { useNavigate } from "react-router-dom";
import {
  Download,
  Shield,
  Zap,
  Eye,
  Clock,
  Hash,
  Users,
  Bell,
  Search,
  Menu,
  Settings,
  MessageCircle,
  Lock,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatAreaProps {
  setMobileSidebarOpen: (open: boolean) => void;
}

const ChatArea = ({ setMobileSidebarOpen }: ChatAreaProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col">
      {/* Заголовок чата */}
      <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-2">
        <Button
          variant="ghost"
          className="lg:hidden text-[#8e9297] hover:text-[#dcddde] hover:bg-[#40444b] p-1 mr-2"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Hash className="w-5 h-5 text-[#8e9297]" />
        <span className="text-white font-semibold">отзывы</span>
        <div className="w-px h-6 bg-[#40444b] mx-2 hidden sm:block"></div>
        <span className="text-[#8e9297] text-sm hidden sm:block">Мессенджер, который работает в России</span>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
        </div>
      </div>

      {/* Сообщения чата */}
      <div className="flex-1 p-2 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto">

        {/* Приветственное сообщение от бота */}
        <div className="flex gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#5865f2] rounded-full flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-white font-medium text-sm sm:text-base">Связь Бот</span>
              <span className="bg-[#5865f2] text-white text-xs px-1 rounded">БОТ</span>
              <span className="text-[#72767d] text-xs hidden sm:inline">Сегодня в 10:00</span>
            </div>
            <div className="text-[#dcddde] text-sm sm:text-base">
              <p className="mb-3 sm:mb-4">
                <strong>Добро пожаловать в Связь!</strong> Мессенджер, который стабильно работает в России без VPN и блокировок.
              </p>
              <div className="bg-[#2f3136] border-l-4 border-[#5865f2] p-3 sm:p-4 rounded">
                <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Что умеет Связь:</h3>
                <ul className="space-y-1 text-xs sm:text-sm text-[#b9bbbe]">
                  <li>✅ Работает в РФ без VPN — всегда стабильно</li>
                  <li>✅ Сквозное шифрование всех сообщений</li>
                  <li>✅ Голосовые и видеозвонки без ограничений</li>
                  <li>✅ Групповые чаты до 10 000 участников</li>
                  <li>✅ Доступен на iOS, Android, Windows и Web</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Сообщение пользователя */}
        <div className="flex gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs sm:text-sm font-medium">М</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-white font-medium text-sm sm:text-base">Мария</span>
              <span className="text-[#72767d] text-xs hidden sm:inline">Сегодня в 10:05</span>
            </div>
            <div className="text-[#dcddde] mb-3 text-sm sm:text-base">
              Наконец-то нормальный мессенджер! Пишу из Москвы, всё летает 🚀
            </div>

            {/* Демо профиля */}
            <div className="bg-[#2f3136] border border-[#202225] rounded-lg overflow-hidden w-full max-w-sm">
              <div className="h-16 sm:h-20 bg-gradient-to-r from-[#5865f2] to-[#7c3aed] relative">
                <div className="absolute -bottom-3 sm:-bottom-4 left-3 sm:left-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#2f3136] bg-[#36393f] overflow-hidden relative">
                    <div className="w-full h-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#2f3136] rounded-full flex items-center justify-center">
                        <span className="text-lg sm:text-2xl">М</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#3ba55c] border-4 border-[#2f3136] rounded-full"></div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-[#4f545c] hover:bg-[#5d6269] text-white text-xs px-2 sm:px-3 py-1 rounded"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Профиль</span>
                </Button>
              </div>

              <div className="pt-4 sm:pt-6 px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-white text-lg sm:text-xl font-bold mb-1">Мария</h3>
                  <div className="flex items-center gap-2 text-[#b9bbbe] text-xs sm:text-sm">
                    <span>@maria_msk</span>
                    <span>·</span>
                    <span>Москва</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#5865f2] rounded-sm"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#3ba55c] rounded-sm"></div>
                    </div>
                  </div>
                </div>

                <div className="mb-3 sm:mb-4">
                  <div className="bg-[#36393f] rounded-lg p-2 sm:p-3 relative">
                    <div className="absolute -top-2 left-3 sm:left-4 w-4 h-4 bg-[#36393f] rotate-45"></div>
                    <div className="flex items-center gap-2 text-[#dcddde] text-xs sm:text-sm">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#3ba55c] rounded-full flex items-center justify-center">
                        <span className="text-xs">✓</span>
                      </div>
                      <span>Онлайн · Связь работает!</span>
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-[#40444b] mb-3 sm:mb-4">
                  <button className="px-3 sm:px-4 py-2 text-white text-xs sm:text-sm font-medium border-b-2 border-[#5865f2]">
                    Активность
                  </button>
                  <button className="px-3 sm:px-4 py-2 text-[#8e9297] text-xs sm:text-sm font-medium hover:text-[#dcddde]">
                    Обо мне
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2 sm:mb-3">
                    <span>Статус</span>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-[#36393f] rounded-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#5865f2] to-[#3ba55c] rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-xs sm:text-sm mb-1">Связь</div>
                      <div className="text-[#dcddde] text-xs sm:text-sm mb-1">Общаюсь в групповом чате</div>
                      <div className="text-[#b9bbbe] text-xs sm:text-sm mb-2">Москва · Россия</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse"></div>
                        <span className="text-[#3ba55c] text-xs font-medium">В сети</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Второе сообщение */}
        <div className="flex gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs sm:text-sm font-medium">И</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-white font-medium text-sm sm:text-base">Иван</span>
              <span className="text-[#72767d] text-xs hidden sm:inline">Сегодня в 10:10</span>
            </div>
            <div className="text-[#dcddde] text-sm sm:text-base">
              Переключился со всеми коллегами — ни один звонок не упал за месяц. Советую всем!
            </div>
          </div>
        </div>

        {/* Секция "Начало работы" */}
        <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-4 sm:p-6 mt-6 sm:mt-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-[#5865f2]" />
            Начни общаться прямо сейчас
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#5865f2] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-sm sm:text-base">1</span>
              </div>
              <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Скачай приложение</h3>
              <p className="text-[#b9bbbe] text-xs sm:text-sm">Доступно для iOS, Android, Windows и в браузере</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#5865f2] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-sm sm:text-base">2</span>
              </div>
              <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Зарегистрируйся</h3>
              <p className="text-[#b9bbbe] text-xs sm:text-sm">Регистрация по номеру телефона за 30 секунд</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#5865f2] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-sm sm:text-base">3</span>
              </div>
              <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Пиши и звони</h3>
              <p className="text-[#b9bbbe] text-xs sm:text-sm">Приглашай друзей и наслаждайся общением</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/auth")} className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 sm:px-8 py-2 sm:py-3 rounded text-sm font-medium">
              <MessageCircle className="w-4 h-4 mr-2" />
              Начать общаться
            </Button>
            <Button
              variant="outline"
              className="border-[#4f545c] text-[#b9bbbe] hover:bg-[#40444b] hover:border-[#6d6f78] px-6 sm:px-8 py-2 sm:py-3 rounded text-sm font-medium bg-transparent"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Скачать приложение
            </Button>
          </div>
        </div>

        {/* Преимущества */}
        <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Почему выбирают Связь?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Работает в РФ без VPN", desc: "Стабильное соединение в любом регионе России" },
              { icon: <Lock className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Сквозное шифрование", desc: "Ваши сообщения не читает никто кроме вас" },
              { icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Быстрая доставка", desc: "Сообщения доходят мгновенно даже при слабом сигнале" },
              { icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Большие группы", desc: "Чаты до 10 000 участников с удобным управлением" },
              { icon: <Eye className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Без слежки", desc: "Никаких сторонних рекламных трекеров" },
              { icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Доступен 24/7", desc: "Серверы в России — 99.9% uptime" },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded hover:bg-[#36393f] transition-colors"
              >
                <div className="text-[#5865f2] mt-0.5">{feature.icon}</div>
                <div>
                  <div className="text-white font-medium text-xs sm:text-sm">{feature.title}</div>
                  <div className="text-[#b9bbbe] text-xs sm:text-sm">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Поле ввода сообщения */}
      <div className="p-2 sm:p-4">
        <div className="bg-[#40444b] rounded-lg px-3 sm:px-4 py-2 sm:py-3">
          <div className="text-[#72767d] text-xs sm:text-sm">Сообщение #отзывы</div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
