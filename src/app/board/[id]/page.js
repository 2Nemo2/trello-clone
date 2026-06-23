"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
    fetchLists();
  }
  // Megkeresi, melyik listában van egy adott kártya ID
  function findListIdByCardId(cardId) {
    for (const listId in cardsByList) {
      if (cardsByList[listId].some((c) => c._id === cardId)) {
        return listId;
      }
    }
    return null;
  }

  function handleDragStart(event) {
    const { active } = event;
    const listId = findListIdByCardId(active.id);
    if (listId) {
      const card = cardsByList[listId].find((c) => c._id === active.id);
      setActiveCard(card);
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const isActiveList = lists.some((l) => l._id === active.id);
    if (!isActiveList) return;
    let overListId = over.id;
    const isOverCard = !lists.some((l) => l._id === over.id);
    if (isOverCard) {
      overListId = findListIdByCardId(over.id);
    }
    const oldIndex = lists.findIndex((l) => l._id === active.id);
    const newIndex = lists.findIndex((l) => l._id === overListId);
    if (oldIndex === -1 || newIndex === -1) return;
    setLists((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function handleCardDelete(card) {
    setCardsForList(
      card.listId,
      (cardsByList[card.listId] || []).filter((c) => c._id !== card._id),
    );
  }
  function handleListDelete(listId) {
    setLists((prev) => prev.filter((l) => l._id !== listId));
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
    const isActiveList = lists.some((l) => l._id === active.id);
    if (isActiveList) {
      const oldIndex = lists.findIndex((l) => l._id === active.id);

      // Ha over egy kártya (nem lista), akkor annak a listáját keressük meg
      let overListId = over.id;
      const isOverCard = !lists.some((l) => l._id === over.id);
      if (isOverCard) {
        overListId = findListIdByCardId(over.id);
      }
      const newIndex = lists.findIndex((l) => l._id === overListId);
      if (oldIndex === -1 || newIndex === -1) return;
      const newLists = arrayMove(lists, oldIndex, newIndex);
      setLists(newLists);
      await fetch("/api/lists/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lists: newLists.map((l, i) => ({ _id: l._id, order: i })),
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
    const oldIndex = activeCards.findIndex((c) => c._id === active.id);
    const newIndex = overCards.findIndex((c) => c._id === over.id);
    if (activeListId === overListId) {
      // Ugyanazon a listán belüli mozgatás
      const newCards = arrayMove(activeCards, oldIndex, newIndex);
      setCardsForList(activeListId, newCards);
      await fetch("/api/cards/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: newCards.map((c, index) => ({ _id: c._id, order: index })),
        }),
      });
    } else {
      // Listák közötti mozgatás
      const movedCard = { ...activeCards[oldIndex], listId: overListId };
      const newActiveCards = activeCards.filter((c) => c._id !== active.id);
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
              _id: c._id,
              order: i,
              listId: activeListId,
            })),
            ...newOverCards.map((c, i) => ({
              _id: c._id,
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
    <main
      className="min-h-screen p-8"
      style={{ backgroundColor: board.background }}
    >
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-3xl font-bold text-white">{board.title}</h1>
        <div className="flex gap-2">
          {/* Tagok kezelése — csak owner és admin látja */}
          {["owner", "admin"].includes(userRole) && (
            <button
              onClick={() => {
                setShowMembers(true);
                fetchMembers();
              }}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition"
            >
              👥 Tagok
            </button>
          )}
          <button
            onClick={() => {
              setShowActivity(true);
              fetchActivities();
            }}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition"
          >
            📋 Aktivitás
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        ondragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Listák vízszintes sorba rendezése */}
        <SortableContext
          items={lists.map((l) => l._id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto items-start">
            {lists.map((list) => (
              <List
                key={list._id}
                list={list}
                cards={cardsByList[list._id] || []}
                setCardsForList={setCardsForList}
                onCardClick={(card) => setSelectedCard(card)}
                onListDelete={handleListDelete}
                userRole={userRole}
              />
            ))}
            {/* Új lista hozzáadása */}
            <form onSubmit={handleCreateList} className="w-64 flex-shrink-0">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="+ Új lista neve..."
                className="bg-white/80 rounded-lg p-3 w-full outline-none text-gray-800 placeholder:text-gray-500"
              />
            </form>
          </div>
        </SortableContext>
        {/* Ez mutatja a húzott kártyát "lebegve" */}
        <DragOverlay>
          {activeCard ? (
            <div className="bg-white rounded p-2 shadow text-sm text-gray-800 rotate-2">
              {activeCard.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Tagok kezelő panel */}
      {showMembers && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowMembers(false)}
          />
          <div className="relative bg-white w-full max-w-sm h-full shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold text-gray-800">👥 Tagok kezelése</h2>
              <button
                onClick={() => setShowMembers(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 border-b">
              <p className="text-xs text-gray-500 mb-2">
                Tag hozzáadása email alapján:
              </p>
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  +
                </button>
              </form>
              {memberError && (
                <p className="text-red-500 text-xs mt-1">{memberError}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* Tulajdonos */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {board.userId === members[0]?.userId ? "Te" : "Tulajdonos"}
                  </p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                  👑 Owner
                </span>
              </div>
              {/* Tagok */}
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {member.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {userRole === "owner" && (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.userId, e.target.value)
                        }
                        className="text-xs border rounded px-1 py-1 text-gray-600 outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        member.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {member.role === "admin" ? "🔑 Admin" : "👤 Member"}
                    </span>
                    {userRole === "owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-gray-400 text-center">
                  Még nincsenek tagok.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aktivitás gomb */}
      <button
        onClick={() => {
          setShowActivity(true);
          fetchActivities();
        }}
        className="fixed bottom-6 right-6 bg-white text-gray-700 shadow-lg rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
      >
        📋 Aktivitás
      </button>
      {/* Aktivitás oldalsáv */}
      {showActivity && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowActivity(false)}
          />
          <div className="relative bg-white w-full max-w-sm h-full shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold text-gray-800">
                📋 Aktivitás napló
              </h2>
              <button
                onClick={() => setShowActivity(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {activities.length === 0 && (
                <p className="text-sm text-gray-400">Még nincs aktivitás.</p>
              )}
              {activities.map((activity) => (
                <div key={activity._id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {activity.userName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      {activityText(activity)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(activity.createdAt).toLocaleString("hu-HU")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kártya részletek modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onSave={(updated) => {
            setCardsForList(
              updated.listId,
              (cardsByList[updated.listId] || []).map((c) =>
                c._id === updated._id ? updated : c,
              ),
            );
          }}
          onDelete={handleCardDelete}
        />
      )}
    </main>
  );
}
