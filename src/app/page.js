"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const COLORS = [
  "#0079bf",
  "#d29034",
  "#519839",
  "#b04632",
  "#89609e",
  "#cd5a91",
  "#4bbf6b",
  "#00aecc",
];

export default function Home() {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(COLORS[0]);
  const [editingBoard, setEditingBoard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  async function fetchBoards() {
    const res = await fetch("/api/boards");
    const data = await res.json();
    setBoards(data);
  }
  const { data: session } = useSession();

  useEffect(() => {
    fetchBoards();
  }, []);

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
    // Minden 30 másodpercben frissíti az értesítéseket
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
    setBackground(COLORS[0]);
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
  return (
    <main className="min-h-screen bg-gray-100">
      {/* Fejléc */}
      <header className="bg-blue-600 text-white px-8 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <h1 className="text-xl font-bold">Volcano L2 Action Tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80">
            👤 {session?.user?.name}
          </span>
          {/* Értesítés harang */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAllRead();
              }}
              className="relative text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              🔔
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
            {/* Értesítés dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl w-80 z-50 overflow-hidden">
                <div className="p-3 border-b flex justify-between items-center">
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
                      className={`p-3 border-b text-sm flex gap-2 items-start ${
                        n.read ? "bg-white" : "bg-blue-50"
                      }`}
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
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition"
          >
            Kijelentkezés
          </button>
        </div>
      </header>
      <div className="p-8">
        {/* Új board form */}
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Új tábla létrehozása
        </h2>
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow p-4 mb-8 flex flex-col gap-3 max-w-md"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tábla neve..."
            className="border rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
          />
          {/* Színválasztó */}
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setBackground(color)}
                className="w-8 h-8 rounded-full border-4 transition"
                style={{
                  backgroundColor: color,
                  borderColor: background === color ? "#1d4ed8" : "transparent",
                }}
              />
            ))}
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Létrehozás
          </button>
        </form>
        {/* Board lista */}
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Táblák</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="rounded-xl shadow overflow-hidden"
              style={{ backgroundColor: board.background }}
            >
              <Link
                href={`/board/${board.id}`}
                className="block p-5 text-white font-semibold text-lg hover:opacity-90 transition"
              >
                {board.title}
                {board.userId !== session?.user?.id && (
                  <span className="block text-xs text-white/70 font-normal mt-1">
                    👥 Megosztott veled
                  </span>
                )}
              </Link>
              {/* Törlés/szerkesztés csak a tulajdonosnak */}
              {board.userId === session?.user?.id && (
                <div className="flex gap-1 px-3 pb-3">
                  <button
                    onClick={() => setEditingBoard({ ...board })}
                    className="text-white/70 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/20 transition"
                  >
                    ✎ Szerkesztés
                  </button>
                  <button
                    onClick={() => handleDelete(board)}
                    className="text-white/70 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/20 transition"
                  >
                    🗑️ Törlés
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Szerkesztő modal */}
      {editingBoard && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingBoard(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Tábla szerkesztése
              </h2>
              <button
                onClick={() => setEditingBoard(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <input
                type="text"
                value={editingBoard.title}
                onChange={(e) =>
                  setEditingBoard({ ...editingBoard, title: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setEditingBoard({ ...editingBoard, background: color })
                    }
                    className="w-8 h-8 rounded-full border-4 transition"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        editingBoard.background === color
                          ? "#1d4ed8"
                          : "transparent",
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBoard(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mentés
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
