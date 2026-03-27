const members = [
  { name: "Мария", status: "Общается в группе", avatar: "М", color: "from-purple-500 to-pink-500" },
  { name: "Иван", status: "В сети", avatar: "И", color: "from-green-500 to-blue-500" },
  { name: "Алексей", status: "Звонит коллеге", avatar: "А", color: "from-blue-500 to-purple-500" },
];

const MembersSidebar = () => {
  return (
    <div className="hidden xl:block w-60 bg-[#2f3136] p-4">
      <div className="mb-4">
        <h3 className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2">В сети — 3</h3>
        <div className="space-y-2">
          {members.map((user, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-[#36393f] cursor-pointer">
              <div
                className={`w-8 h-8 bg-gradient-to-r ${user.color} rounded-full flex items-center justify-center relative`}
              >
                <span className="text-white text-sm font-medium">{user.avatar}</span>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] border-2 border-[#2f3136] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{user.name}</div>
                <div className="text-[#b9bbbe] text-xs truncate">{user.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembersSidebar;
