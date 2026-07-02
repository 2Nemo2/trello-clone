"use client";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
const COLORS = [
  { color: "#0079bf", name: "Kék" },
  { color: "#d29034", name: "Narancs" },
  { color: "#519839", name: "Zöld" },
  { color: "#b04632", name: "Piros" },
  { color: "#89609e", name: "Lila" },
  { color: "#cd5a91", name: "Rózsaszín" },
  { color: "#4bbf6b", name: "Menta" },
  { color: "#00aecc", name: "Cián" },
];
export default function Home() {
  const { data: session } = useSession();
  const [boards, setBoards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(COLORS[0].color);
  const [editingBoard, setEditingBoard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  async function fetchBoards() {
    const res = await fetch("/api/boards");
    const data = await res.json();
    setBoards(data);
  }
  async function fetchNotifications() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data);
  }
  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }
  useEffect(() => {
    fetchBoards();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);
  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, background }),
    });
    setTitle("");
    setBackground(COLORS[0].color);
    setShowModal(false);
    fetchBoards();
  }
  async function handleDelete(board) {
    if (!confirm(`Törlöd a "${board.title}" táblát?`)) return;
    await fetch(`/api/boards/${board.id}`, { method: "DELETE" });
    fetchBoards();
  }
  async function handleEdit(e) {
    e.preventDefault();
    await fetch(`/api/boards/${editingBoard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editingBoard.title,
        background: editingBoard.background,
      }),
    });
    setEditingBoard(null);
    fetchBoards();
  }
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fejléc */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 rounded p-1.5">
            <span className="text-white text-lg font-bold">T</span>
          </div>
          <h1 className="text-white text-lg font-bold tracking-tight">
            Trello Klón
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Értesítések */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAllRead();
              }}
              className="relative text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-11 bg-white rounded-xl shadow-2xl w-80 z-50 overflow-hidden border border-gray-100">
                <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    Értesítések
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="text-sm text-gray-400 p-4 text-center">
                      Nincs értesítés.
                    </p>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b text-sm flex gap-2 items-start ${n.read ? "bg-white" : "bg-blue-50"}`}
                    >
                      <span className="text-lg">🔔</span>
                      <div>
                        <p className="text-gray-700">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(n.createdAt).toLocaleString("hu-HU")}
                        </p>
                        {n.boardId && (
                          <a
                            href={`/board/${n.boardId}`}
                            className="text-xs text-blue-600 hover:underline mt-0.5 block"
                          >
                            Board megnyitása →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* User */}
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-200 hidden sm:block">
              {session?.user?.name}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
          >
            Kilépés
          </button>
        </div>
      </header>
      {/* Tartalom */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Táblák fejléc */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-gray-300">
            <span>👤</span>
            <h2 className="font-semibold">Saját táblák</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            Új tábla
          </button>
        </div>
        {/* Board grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="group relative rounded-xl overflow-hidden shadow-lg aspect-video"
            >
              {/* Háttér */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: board.background }}
              />
              {/* Overlay hover-re */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
              {/* Link */}
              <Link
                href={`/board/${board.id}`}
                className="absolute inset-0 flex items-end p-3"
              >
                <div>
                  <p className="text-white font-semibold text-sm drop-shadow">
                    {board.title}
                  </p>
                  {board.userId !== session?.user?.id && (
                    <p className="text-white/70 text-xs">👥 Megosztott</p>
                  )}
                </div>
              </Link>
              {/* Akció gombok — csak hover-re látszanak */}
              {board.userId === session?.user?.id && (
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingBoard({ ...board });
                    }}
                    className="bg-black/30 hover:bg-black/50 text-white text-xs p-1.5 rounded-lg transition"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(board);
                    }}
                    className="bg-black/30 hover:bg-red-500/70 text-white text-xs p-1.5 rounded-lg transition"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
          {/* Új tábla kártya */}
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl aspect-video bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-gray-600 hover:border-gray-500 flex items-center justify-center text-gray-400 hover:text-gray-200 transition group"
          >
            <div className="text-center">
              <p className="text-2xl group-hover:scale-110 transition">+</p>
              <p className="text-xs mt-1">Új tábla</p>
            </div>
          </button>
        </div>
      </main>
      {/* Új tábla modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Új tábla létrehozása
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {/* Előnézet */}
            <div
              className="w-full h-24 rounded-xl mb-4 flex items-end p-3 transition-all"
              style={{ backgroundColor: background }}
            >
              <p className="text-white font-semibold text-sm drop-shadow">
                {title || "Tábla neve..."}
              </p>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Tábla neve *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="pl. Marketing, Fejlesztés..."
                  autoFocus
                  required
                  className="w-full border rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Háttérszín
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map(({ color, name }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackground(color)}
                      title={name}
                      className="h-10 rounded-lg transition hover:scale-105 relative"
                      style={{ backgroundColor: color }}
                    >
                      {background === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-lg">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={!title.trim()}
                className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Létrehozás
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Szerkesztő modal */}
      {editingBoard && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingBoard(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Tábla szerkesztése
              </h2>
              <button
                onClick={() => setEditingBoard(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {/* Előnézet */}
            <div
              className="w-full h-24 rounded-xl mb-4 flex items-end p-3 transition-all"
              style={{ backgroundColor: editingBoard.background }}
            >
              <p className="text-white font-semibold text-sm drop-shadow">
                {editingBoard.title}
              </p>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <input
                type="text"
                value={editingBoard.title}
                onChange={(e) =>
                  setEditingBoard({ ...editingBoard, title: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setEditingBoard({ ...editingBoard, background: color })
                    }
                    title={name}
                    className="h-10 rounded-lg transition hover:scale-105 relative"
                    style={{ backgroundColor: color }}
                  >
                    {editingBoard.background === color && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-lg">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBoard(null)}
                  className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Mentés
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
