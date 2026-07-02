"use client";
import { useState, useEffect } from "react";
const LABELS = [
  { text: "Fontos", color: "bg-red-500" },
  { text: "Haladó", color: "bg-orange-400" },
  { text: "Folyamatban", color: "bg-yellow-400" },
  { text: "Kész", color: "bg-green-500" },
  { text: "Kérdés", color: "bg-blue-500" },
  { text: "Ötlet", color: "bg-purple-500" },
];
export default function CardModal({ card, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : "",
  );
  const [assignees, setAssignees] = useState(card.assignees || []);
  const [labels, setLabels] = useState(card.labels || []);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState(card.comments ?? []);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    }
    fetchUsers();
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate, assignees, labels }),
    });
    const updated = await res.json();
    onSave(updated);
    setSaving(false);
    onClose();
  }
  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await fetch(`/api/cards/${card.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment }),
    });
    const updated = await res.json();
    setComments(updated.comments);
    setNewComment("");
  }
  async function handleDeleteComment(commentId) {
    const res = await fetch(`/api/cards/${card.id}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    const updated = await res.json();
    setComments(updated.comments);
  }
  function toggleAssignee(user) {
    const isAssigned = assignees.some((a) => a.userId === user.id);
    if (isAssigned) {
      setAssignees(assignees.filter((a) => a.userId !== user.id));
    } else {
      setAssignees([...assignees, { userId: user.id, userName: user.name }]);
    }
  }
  function toggleLabel(labelText) {
    if (labels.includes(labelText)) {
      setLabels(labels.filter((l) => l !== labelText));
    } else {
      setLabels([...labels, labelText]);
    }
  }
  function dueDateStatus() {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    if (due < today) return "overdue";
    if (due.getTime() === today.getTime()) return "today";
    return "upcoming";
  }
  const status = dueDateStatus();
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fejléc */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Kártya szerkesztése</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Cím */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Cím
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Leírás */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Leírás
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adj hozzá leírást..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-500"
            />
          </div>
          {/* Határidő */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Határidő
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            {status === "overdue" && (
              <p className="text-red-400 text-xs mt-1">⚠️ Lejárt határidő!</p>
            )}
            {status === "today" && (
              <p className="text-orange-400 text-xs mt-1">⏰ Ma esedékes!</p>
            )}
          </div>
          {/* Címkék */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Címkék
            </label>
            <div className="flex flex-wrap gap-2">
              {LABELS.map((label) => (
                <button
                  key={label.text}
                  type="button"
                  onClick={() => toggleLabel(label.text)}
                  className={`px-3 py-1 rounded-full text-xs font-medium text-white transition ${label.color} ${
                    labels.includes(label.text)
                      ? "ring-2 ring-white/50 scale-105"
                      : "opacity-50 hover:opacity-75"
                  }`}
                >
                  {label.text}
                </button>
              ))}
            </div>
          </div>
          {/* User hozzárendelés — több user */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Hozzárendelt személyek
            </label>
            <div className="flex flex-col gap-1.5">
              {users.map((user) => {
                const isAssigned = assignees.some((a) => a.userId === user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleAssignee(user)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition text-left ${
                      isAssigned
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                        : "bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isAssigned ? "bg-blue-500" : "bg-gray-600"
                      }`}
                    >
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      ({user.email})
                    </span>
                    {isAssigned && (
                      <span className="text-blue-400 text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Gombok */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
            <button
              onClick={async () => {
                await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
                onDelete(card);
                onClose();
              }}
              className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl mr-auto transition"
            >
              Törlés
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 rounded-xl transition"
            >
              Mégse
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {saving ? "Mentés..." : "Mentés"}
            </button>
          </div>
          {/* Kommentek */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              💬 Kommentek
            </h3>
            <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Írj kommentet..."
                className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
              >
                Küldés
              </button>
            </form>
            <div className="flex flex-col gap-2">
              {comments.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  Még nincs komment.
                </p>
              )}
              {[...comments].reverse().map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-800 rounded-xl p-3 border border-gray-700"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                        {comment.userName?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-blue-400">
                        {comment.userName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString(
                          "hu-HU",
                        )}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-gray-500 hover:text-red-400 transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
