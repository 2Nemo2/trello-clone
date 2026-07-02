"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import List from "@/app/components/List";
import CardModal from "@/app/components/CardModal";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id;
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({}); // { listId: [cards] }
  const [newListTitle, setNewListTitle] = useState("");
  const [activeCard, setActiveCard] = useState(null); // A húzott kártya adatai
  const [selectedCard, setSelectedCard] = useState(null); // A részletekben megnyitott kártya adatai
  const [showActivity, setShowActivity] = useState(false);
  const [activities, setActivities] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // ne induljon húzás simple kattintásra
    }),
  );
  async function fetchBoard() {
    const res = await fetch(`/api/boards/${boardId}`);
    const data = await res.json();
    setBoard(data);
    // Role meghatározása
    const res2 = await fetch("/api/auth/session");
    const session = await res2.json();
    if (data.userId === session?.user?.id) {
      setUserRole("owner");
    } else {
      const member = data.members?.find((m) => m.userId === session?.user?.id);
      setUserRole(member?.role || "member");
    }
  }
  async function fetchMembers() {
    const res = await fetch(`/api/boards/${boardId}/members`);
    const data = await res.json();
    setMembers(data);
  }
  async function handleAddMember(e) {
    e.preventDefault();
    setMemberError("");
    const res = await fetch(`/api/boards/${boardId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newMemberEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMemberError(data.error);
    } else {
      setMembers(data);
      setNewMemberEmail("");
    }
  }
  async function handleRoleChange(userId, newRole) {
    await fetch(`/api/boards/${boardId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    fetchMembers();
  }
  async function handleRemoveMember(userId) {
    if (!confirm("Biztosan eltávolítod ezt a tagot?")) return;
    await fetch(`/api/boards/${boardId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchMembers();
  }
  async function fetchLists() {
    const res = await fetch(`/api/lists?boardId=${boardId}`);
    const data = await res.json();
    setLists(data);
  }
  useEffect(() => {
    fetchBoard();
    fetchLists();
  }, [boardId]);
  function setCardsForList(listId, cards) {
    setCardsByList((prev) => ({ ...prev, [listId]: cards }));
  }
  async function handleCreateList(e) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newListTitle, boardId }),
    });
    setNewListTitle("");
    setShowNewList(false);
    fetchLists();
  }

  // Megkeresi, melyik listában van egy adott kártya ID
  function findListIdByCardId(cardId) {
    for (const listId in cardsByList) {
      if (cardsByList[listId].some((c) => c.id === cardId)) {
        return listId;
      }
    }
    return null;
  }

  function handleDragStart(event) {
    const { active } = event;
    const listId = findListIdByCardId(active.id);
    if (listId) {
      const card = cardsByList[listId].find((c) => c.id === active.id);
      setActiveCard(card);
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const isActiveList = lists.some((l) => l.id === active.id);
    if (!isActiveList) return;
    let overListId = over.id;
    const isOverCard = !lists.some((l) => l.id === over.id);
    if (isOverCard) {
      overListId = findListIdByCardId(over.id);
    }
    const oldIndex = lists.findIndex((l) => l.id === active.id);
    const newIndex = lists.findIndex((l) => l.id === overListId);
    if (oldIndex === -1 || newIndex === -1) return;
    setLists((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function handleCardDelete(card) {
    setCardsForList(
      card.listId,
      (cardsByList[card.listId] || []).filter((c) => c.id !== card.id),
    );
  }
  function handleListDelete(listId) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setCardsByList((prev) => {
      const updated = { ...prev };
      delete updated[listId];
      return updated;
    });
  }

  function activityText(activity) {
    const { type, data, userName } = activity;
    switch (type) {
      case "card_created":
        return `${userName} létrehozta a "${data.cardTitle}" kártyát a "${data.listTitle}" listában`;
      case "card_updated":
        return `${userName} frissítette a "${data.cardTitle}" kártyát`;
      case "card_deleted":
        return `${userName} törölte a "${data.cardTitle}" kártyát`;
      case "card_moved":
        return `${userName} áthelyezte a "${data.cardTitle}" kártyát`;
      case "comment_added":
        return `${userName} kommentelt: "${data.text}"`;
      case "list_created":
        return `${userName} létrehozta a "${data.listTitle}" listát`;
      case "list_deleted":
        return `${userName} törölte a "${data.listTitle}" listát`;
      case "member_added":
        return `${userName} hozzárendelte: ${data.addedUsers?.join(", ")}`;
      default:
        return `${userName} műveletet hajtott végre`;
    }
  }

  async function fetchActivities() {
    const res = await fetch(`/api/boards/${boardId}/activity`);
    const data = await res.json();
    setActivities(data);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveCard(null); // Húzás befejezése után töröljük az aktív kártyát
    if (!over || active.id === over.id) return;

    // Lista mozgatás?
    const isActiveList = lists.some((l) => l.id === active.id);
    if (isActiveList) {
      const oldIndex = lists.findIndex((l) => l.id === active.id);

      // Ha over egy kártya (nem lista), akkor annak a listáját keressük meg
      let overListId = over.id;
      const isOverCard = !lists.some((l) => l.id === over.id);
      if (isOverCard) {
        overListId = findListIdByCardId(over.id);
      }
      const newIndex = lists.findIndex((l) => l.id === overListId);
      if (oldIndex === -1 || newIndex === -1) return;
      const newLists = arrayMove(lists, oldIndex, newIndex);
      setLists(newLists);
      await fetch("/api/lists/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lists: newLists.map((l, i) => ({ id: l.id, order: i })),
        }),
      });
      return;
    }

    const activeListId = findListIdByCardId(active.id);
    if (!activeListId) return;
    // Meghatározzuk a céllistát:
    // Ha kártya fölé ejtjük → annak a kártyának a listája
    // Ha lista "dobozába" ejtjük → maga a lista ID-je
    const overListId = findListIdByCardId(over.id) || over.id;
    const activeCards = cardsByList[activeListId] || [];
    const overCards = cardsByList[overListId] || [];
    const oldIndex = activeCards.findIndex((c) => c.id === active.id);
    const newIndex = overCards.findIndex((c) => c.id === over.id);
    if (activeListId === overListId) {
      // Ugyanazon a listán belüli mozgatás
      const newCards = arrayMove(activeCards, oldIndex, newIndex);
      setCardsForList(activeListId, newCards);
      await fetch("/api/cards/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: newCards.map((c, index) => ({ id: c.id, order: index })),
        }),
      });
    } else {
      // Listák közötti mozgatás
      const movedCard = { ...activeCards[oldIndex], listId: overListId };
      const newActiveCards = activeCards.filter((c) => c.id !== active.id);
      const newOverCards = [...overCards];
      // Ha kártya fölé ejtettük, oda szúrjuk be, különben a végére
      const insertIndex = newIndex === -1 ? newOverCards.length : newIndex;
      newOverCards.splice(insertIndex, 0, movedCard);
      // Azonnali UI frissítés
      setCardsForList(activeListId, newActiveCards);
      setCardsForList(overListId, newOverCards);
      // Mentés az adatbázisba
      await fetch("/api/cards/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: [
            ...newActiveCards.map((c, i) => ({
              id: c.id,
              order: i,
              listId: activeListId,
            })),
            ...newOverCards.map((c, i) => ({
              id: c.id,
              order: i,
              listId: overListId,
            })),
          ],
        }),
      });
    }
    setActiveCard(null); // Húzás befejezése után töröljük az aktív kártyát
  }

  if (!board) return <div className="p-8">Betöltés...</div>;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: board.background }}
    >
      {/* Fejléc */}
      <header className="bg-black/20 backdrop-blur-sm px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-white/70 hover:text-white transition text-sm flex items-center gap-1"
          >
            ← Főoldal
          </Link>
          <span className="text-white/30">|</span>
          <h1 className="text-white font-bold text-lg">{board.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {["owner", "admin"].includes(userRole) && (
            <button
              onClick={() => {
                setShowMembers(true);
                fetchMembers();
              }}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              👥 <span className="hidden sm:inline">Tagok</span>
            </button>
          )}
          <button
            onClick={() => {
              setShowActivity(true);
              fetchActivities();
            }}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition flex items-center gap-1"
          >
            📋 <span className="hidden sm:inline">Aktivitás</span>
          </button>
        </div>
      </header>
      {/* Listák területe */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lists.map((l) => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-3 items-start h-full">
              {lists.map((list) => (
                <List
                  key={list.id}
                  list={list}
                  cards={cardsByList[list.id] || []}
                  setCardsForList={setCardsForList}
                  onCardClick={(card) => setSelectedCard(card)}
                  onListDelete={handleListDelete}
                  userRole={userRole}
                />
              ))}
              {/* Új lista */}
              <div className="w-72 flex-shrink-0">
                {showNewList ? (
                  <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-3">
                    <input
                      type="text"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="Lista neve..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateList(e);
                        if (e.key === "Escape") setShowNewList(false);
                      }}
                      className="w-full bg-white rounded-lg px-3 py-2 text-gray-800 outline-none text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateList}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg transition"
                      >
                        Hozzáadás
                      </button>
                      <button
                        onClick={() => {
                          setShowNewList(false);
                          setNewListTitle("");
                        }}
                        className="text-gray-300 hover:text-white text-sm px-2 py-1.5 rounded-lg transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewList(true)}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm px-4 py-3 rounded-xl transition flex items-center gap-2"
                  >
                    <span className="text-lg leading-none">+</span>
                    Lista hozzáadása
                  </button>
                )}
              </div>
            </div>
          </SortableContext>
          <DragOverlay>
            {activeCard ? (
              <div className="bg-white rounded-xl p-3 shadow-2xl text-sm text-gray-800 rotate-2 opacity-90">
                {activeCard.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      {/* Aktivitás oldalsáv */}
      {showActivity && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowActivity(false)}
          />
          <div className="relative bg-gray-900 w-full max-w-sm h-full shadow-2xl flex flex-col border-l border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="font-semibold text-white">📋 Aktivitás napló</h2>
              <button
                onClick={() => setShowActivity(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {activities.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  Még nincs aktivitás.
                </p>
              )}
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {activity.userName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">
                      {activityText(activity)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(activity.createdAt).toLocaleString("hu-HU")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Tagok oldalsáv */}
      {showMembers && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMembers(false)}
          />
          <div className="relative bg-gray-900 w-full max-w-sm h-full shadow-2xl flex flex-col border-l border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="font-semibold text-white">👥 Tagok kezelése</h2>
              <button
                onClick={() => setShowMembers(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 border-b border-gray-700">
              <p className="text-xs text-gray-400 mb-2">
                Tag hozzáadása email alapján:
              </p>
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  +
                </button>
              </form>
              {memberError && (
                <p className="text-red-400 text-xs mt-1">{memberError}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {/* Tulajdonos */}
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold">
                    {session?.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-400">Tulajdonos</p>
                  </div>
                </div>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-medium">
                  👑 Owner
                </span>
              </div>
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-xl gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {member.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {userRole === "owner" && (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.userId, e.target.value)
                        }
                        className="text-xs bg-gray-700 border border-gray-600 rounded px-1 py-1 text-gray-300 outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {userRole === "owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-gray-500 hover:text-red-400 text-xs transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  Még nincsenek tagok.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Kártya modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onSave={(updated) => {
            setCardsForList(
              updated.listId,
              (cardsByList[updated.listId] || []).map((c) =>
                c.id === updated.id ? updated : c,
              ),
            );
          }}
          onDelete={handleCardDelete}
        />
      )}
    </div>
  );
}
