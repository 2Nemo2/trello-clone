"use client";
import { useState, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Card from "./Card";
export default function List({
  list,
  cards,
  setCardsForList,
  onCardClick,
  onListDelete,
  userRole,
}) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { setNodeRef: setDropRef } = useDroppable({ id: list.id });
  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  async function fetchCards() {
    const res = await fetch(`/api/cards?listId=${list.id}`);
    const data = await res.json();
    setCardsForList(list.id, data);
  }
  useEffect(() => {
    fetchCards();
  }, [list.id]);
  async function handleCreateCard(e) {
    e?.preventDefault();
    if (!newCardTitle.trim()) return;
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newCardTitle, listId: list.id }),
    });
    setNewCardTitle("");
    fetchCards();
  }
  return (
    <div
      ref={setSortRef}
      style={style}
      className="w-72 flex-shrink-0 flex flex-col max-h-[calc(100vh-120px)]"
    >
      {/* Lista fejléc */}
      <div className="bg-gray-800 rounded-t-xl px-3 py-2.5 flex items-center justify-between">
        <h2
          {...attributes}
          {...listeners}
          className="font-semibold text-white text-sm cursor-grab active:cursor-grabbing flex-1 truncate"
        >
          {list.title}
        </h2>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded-full">
            {cards.length}
          </span>
          {["owner", "admin"].includes(userRole) && (
            <button
              onClick={async () => {
                if (!confirm(`Törlöd a "${list.title}" listát?`)) return;
                await fetch(`/api/lists/${list.id}`, { method: "DELETE" });
                onListDelete(list.id);
              }}
              className="text-gray-400 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition ml-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {/* Kártyák */}
      <div className="bg-gray-800/90 flex-1 overflow-y-auto px-2 py-2">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setDropRef} className="flex flex-col gap-2 min-h-[8px]">
            {cards.map((card) => (
              <Card key={card.id} card={card} onClick={onCardClick} />
            ))}
          </div>
        </SortableContext>
      </div>
      {/* Új kártya */}
      <div className="bg-gray-800 rounded-b-xl px-2 py-2">
        {showForm ? (
          <div>
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Kártya neve..."
              className="w-full bg-white rounded-lg p-2 text-sm text-gray-800 outline-none resize-none border-2 border-blue-400"
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCard(e);
                }
                if (e.key === "Escape") setShowForm(false);
              }}
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={handleCreateCard}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium"
              >
                Hozzáadás
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewCardTitle("");
                }}
                className="text-gray-400 hover:text-white text-xs px-2 py-1.5 rounded-lg transition"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full text-gray-400 hover:text-white hover:bg-gray-700 text-sm py-1.5 px-2 rounded-lg transition flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            Kártya hozzáadása
          </button>
        )}
      </div>
    </div>
  );
}
