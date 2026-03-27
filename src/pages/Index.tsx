import { useState } from "react";
import { MessageCircle } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import ChannelSidebar from "@/components/landing/ChannelSidebar";
import ChatArea from "@/components/landing/ChatArea";
import MembersSidebar from "@/components/landing/MembersSidebar";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("svyaz_user") || "null"); } catch { return null; }
  })();

  return (
    <div className="min-h-screen bg-[#36393f] text-white overflow-x-hidden">
      <LandingNav
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
      />

      <div className="flex min-h-screen">
        {/* Боковая панель серверов */}
        <div className="hidden lg:flex w-[72px] bg-[#202225] flex-col items-center py-3 gap-2">
          <div className="w-12 h-12 bg-[#5865f2] rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="w-8 h-[2px] bg-[#36393f] rounded-full"></div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-12 h-12 bg-[#36393f] rounded-3xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer hover:bg-[#5865f2]"
            >
              <span className="text-[#dcddde] text-sm font-medium">{i}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          <ChannelSidebar
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
          />
          <ChatArea setMobileSidebarOpen={setMobileSidebarOpen} />
          <MembersSidebar />
        </div>
      </div>
    </div>
  );
};

export default Index;
