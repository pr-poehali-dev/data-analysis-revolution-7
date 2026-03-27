import { useState, useEffect, useRef } from "react";
import {
  PhoneOff, Mic, MicOff, Video, VideoOff,
  Users, Crown, CheckCircle,
} from "lucide-react";

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

interface Participant {
  user_id: number;
  username: string;
  avatar_url?: string | null;
  is_verified?: boolean;
  muted?: boolean;
  video?: boolean;
}

interface Props {
  roomName: string;
  currentUser: { user_id: number; username: string; avatar_url?: string | null };
  onLeave: () => void;
}

const CallScreen = ({ roomName, currentUser, onLeave }: Props) => {
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([
    { ...currentUser, muted: false, video: false },
  ]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const toggleMic = () => {
    setMuted(v => !v);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = muted; });
    }
    setParticipants(prev => prev.map(p =>
      p.user_id === currentUser.user_id ? { ...p, muted: !muted } : p
    ));
  };

  const toggleVideo = async () => {
    if (videoOn) {
      streamRef.current?.getVideoTracks().forEach(t => t.stop());
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      setVideoOn(false);
      setParticipants(prev => prev.map(p =>
        p.user_id === currentUser.user_id ? { ...p, video: false } : p
      ));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !muted });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play();
        }
        setVideoOn(true);
        setParticipants(prev => prev.map(p =>
          p.user_id === currentUser.user_id ? { ...p, video: true } : p
        ));
      } catch {
        // Нет доступа к камере
      }
    }
  };

  const handleLeave = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onLeave();
  };

  return (
    <div className="fixed inset-0 bg-[#111214] z-50 flex flex-col">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#202225]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse" />
            <span className="text-white font-semibold">{roomName}</span>
          </div>
          <span className="text-[#b9bbbe] text-xs">{formatDuration(duration)}</span>
        </div>
        <div className="flex items-center gap-1 text-[#b9bbbe] text-sm">
          <Users className="w-4 h-4 mr-1" />
          {participants.length}
        </div>
      </div>

      {/* Участники */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className={`grid gap-4 h-full ${
          participants.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
          participants.length <= 4 ? "grid-cols-2" :
          participants.length <= 9 ? "grid-cols-3" :
          "grid-cols-4"
        }`}>
          {participants.map(p => (
            <ParticipantTile
              key={p.user_id}
              participant={p}
              isCurrentUser={p.user_id === currentUser.user_id}
              localVideoRef={p.user_id === currentUser.user_id ? localVideoRef : undefined}
            />
          ))}
        </div>
      </div>

      {/* Панель управления */}
      <div className="px-6 py-6 border-t border-[#202225] flex items-center justify-center gap-4">
        <ControlBtn
          active={muted}
          activeColor="bg-[#ed4245]"
          inactiveColor="bg-[#40444b]"
          onClick={toggleMic}
          title={muted ? "Включить микрофон" : "Выключить микрофон"}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </ControlBtn>

        <ControlBtn
          active={videoOn}
          activeColor="bg-[#5865f2]"
          inactiveColor="bg-[#40444b]"
          onClick={toggleVideo}
          title={videoOn ? "Выключить камеру" : "Включить камеру"}
        >
          {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </ControlBtn>

        <button
          onClick={handleLeave}
          className="w-14 h-14 bg-[#ed4245] hover:bg-[#c03537] rounded-full flex items-center justify-center text-white transition-colors"
          title="Покинуть звонок"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

const ParticipantTile = ({
  participant,
  isCurrentUser,
  localVideoRef,
}: {
  participant: Participant;
  isCurrentUser: boolean;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
}) => (
  <div className="relative bg-[#1e2124] rounded-xl overflow-hidden aspect-video flex items-center justify-center">
    {participant.video && localVideoRef ? (
      <video
        ref={localVideoRef}
        muted
        autoPlay
        playsInline
        className="w-full h-full object-cover scale-x-[-1]"
      />
    ) : (
      <div className="flex flex-col items-center gap-3">
        {participant.avatar_url ? (
          <img
            src={participant.avatar_url}
            alt={participant.username}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className={`w-20 h-20 bg-gradient-to-br ${avatarColor(participant.username)} rounded-full flex items-center justify-center`}>
            <span className="text-white text-2xl font-bold">{participant.username[0].toUpperCase()}</span>
          </div>
        )}
      </div>
    )}

    {/* Имя + статусы */}
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
      <div className="flex items-center gap-1">
        <span className="text-white text-sm font-medium truncate">
          {participant.username}{isCurrentUser ? " (вы)" : ""}
        </span>
        {participant.is_verified && <CheckCircle className="w-3 h-3 text-[#3ba55c] flex-shrink-0" />}
        {participant.muted && <MicOff className="w-3 h-3 text-[#ed4245] flex-shrink-0" />}
      </div>
    </div>
  </div>
);

const ControlBtn = ({
  active,
  activeColor,
  inactiveColor,
  onClick,
  title,
  children,
}: {
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${active ? activeColor : inactiveColor} hover:opacity-80`}
  >
    {children}
  </button>
);

export default CallScreen;
