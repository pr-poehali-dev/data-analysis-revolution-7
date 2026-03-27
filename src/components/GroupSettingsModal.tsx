import { useState } from "react";
import { X, Trash2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import func2url from "../../backend/func2url.json";

const GROUPS_URL = func2url.groups;

interface Group {
  id: number;
  name: string;
  description: string;
  owner_id: number;
}

interface Props {
  group: Group;
  token: string;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: (name: string, description: string) => void;
  onDeleted: () => void;
}

const GroupSettingsModal = ({ group, token, isAdmin, onClose, onUpdated, onDeleted }: Props) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const headers = { "Content-Type": "application/json", "X-Session-Token": token };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) { setSaveError("Минимум 2 символа"); return; }
    setSaveError("");
    setSaving(true);
    const res = await fetch(`${GROUPS_URL}?action=update`, {
      method: "POST", headers,
      body: JSON.stringify({ group_id: group.id, name: name.trim(), description: description.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setSaveError(data.error || "Ошибка"); setSaving(false); return; }
    onUpdated(name.trim(), description.trim());
    setSaving(false);
    onClose();
  };

  const deleteGroup = async () => {
    setDeleting(true);
    const res = await fetch(`${GROUPS_URL}?action=delete`, {
      method: "POST", headers,
      body: JSON.stringify({ group_id: group.id }),
    });
    if (res.ok) onDeleted();
    else setDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#36393f] rounded-lg w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="px-6 pt-6 pb-4 border-b border-[#202225] flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Настройки группы</h2>
            <p className="text-[#b9bbbe] text-xs mt-0.5">#{group.name}</p>
          </div>
          <button onClick={onClose} className="text-[#b9bbbe] hover:text-white p-1 rounded hover:bg-[#40444b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={saveSettings} className="p-6 space-y-4">
          <div>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">
              Название группы
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={64}
              placeholder="Название группы"
              className="bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] focus:border-[#5865f2]"
            />
          </div>
          <div>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">
              Описание <span className="text-[#72767d] normal-case font-normal">(необязательно)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="О чём эта группа?"
              className="w-full bg-[#40444b] border border-[#202225] rounded-md text-white text-sm p-2.5 outline-none focus:border-[#5865f2] resize-none placeholder:text-[#72767d]"
            />
          </div>
          {saveError && <p className="text-[#ed4245] text-sm">{saveError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}
              className="flex-1 text-[#b9bbbe] hover:bg-[#40444b]">
              Отмена
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}
              className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>

        {/* Опасная зона */}
        <div className="px-6 pb-6">
          <div className="border border-[#ed4245]/30 rounded-lg p-4 bg-[#ed4245]/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#ed4245]" />
              <span className="text-[#ed4245] text-sm font-semibold">Опасная зона</span>
            </div>
            {confirmDelete ? (
              <div className="space-y-3">
                <p className="text-[#b9bbbe] text-sm">
                  Ты уверен? Это удалит группу и <span className="text-white font-medium">все сообщения</span> без возможности восстановления.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={deleteGroup}
                    disabled={deleting}
                    className="bg-[#ed4245] hover:bg-[#c03537] text-white flex-1"
                  >
                    {deleting ? "Удаление..." : "Да, удалить навсегда"}
                  </Button>
                  <Button
                    onClick={() => setConfirmDelete(false)}
                    variant="ghost"
                    className="text-[#b9bbbe] hover:bg-[#40444b]"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-[#ed4245] hover:text-white text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить группу
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
