import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  newGroupName: string;
  newGroupDesc: string;
  creating: boolean;
  createError: string;
  onChangeName: (value: string) => void;
  onChangeDesc: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const CreateGroupModal = ({
  newGroupName,
  newGroupDesc,
  creating,
  createError,
  onChangeName,
  onChangeDesc,
  onSubmit,
  onClose,
}: Props) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-[#36393f] rounded-lg w-full max-w-md shadow-2xl">
      <div className="p-6 border-b border-[#202225] flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Создать группу</h2>
        <button onClick={onClose} className="text-[#b9bbbe] hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">
            Название группы
          </label>
          <Input
            value={newGroupName}
            onChange={e => onChangeName(e.target.value)}
            placeholder="Моя группа"
            maxLength={64}
            autoFocus
            className="bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] focus:border-[#5865f2]"
          />
        </div>
        <div>
          <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">
            Описание <span className="text-[#72767d] normal-case font-normal">(необязательно)</span>
          </label>
          <Input
            value={newGroupDesc}
            onChange={e => onChangeDesc(e.target.value)}
            placeholder="О чём эта группа?"
            maxLength={200}
            className="bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] focus:border-[#5865f2]"
          />
        </div>
        {createError && <p className="text-[#ed4245] text-sm">{createError}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}
            className="flex-1 text-[#b9bbbe] hover:bg-[#40444b]">
            Отмена
          </Button>
          <Button type="submit" disabled={creating || !newGroupName.trim()}
            className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white">
            {creating ? "Создание..." : "Создать"}
          </Button>
        </div>
      </form>
    </div>
  </div>
);

export default CreateGroupModal;
