"use client";
import { useState, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Card from "./Card";
import { useDroppable } from "@dnd-kit/core";

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
    e.preventDefault();
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
      className="bg-gray-100 rounded-lg p-3 w-64 flex-shrink-0"
    >
      <div className="flex justify-between items-center mb-2">
        <h2
          {...attributes}
          {...listeners}
          className="font-semibold text-gray-800 cursor-grab active:cursor-grabbing"
        >
          {list.title}
        </h2>
        {["owner", "admin"].includes(userRole) && (
          <button
            onClick={async () => {
              if (!confirm(`Törlöd a "${list.title}" listát?`)) return;
              await fetch(`/api/lists/${list.id}`, { method: "DELETE" });
              onListDelete(list.id);
            }}
            className="text-gray-400 hover:text-red-500 text-sm px-1"
          >
            ✕
          </button>
        )}
      </div>
      {/* Kártyák - sorba rendezhető terület */}
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setDropRef} className="flex flex-col gap-2 mb-2 min-h-[10px]">
          {cards.map((card) => (
            <Card key={card.id} card={card} onClick={onCardClick} />
          ))}
        </div>
      </SortableContext>
      {/* Új kártya form */}
      {showForm ? (
        <form onSubmit={handleCreateCard}>
          <textarea
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Kártya neve..."
            className="w-full rounded p-2 text-sm border outline-none text-gray-500"
            rows={2}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCreateCard(e);
              }
            }}
          />
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
            >
              Hozzáadás
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-2"
            >
              ✕
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-gray-500 hover:bg-gray-200 w-full text-left p-2 rounded"
        >
          + Kártya hozzáadása
        </button>
      )}
    </div>
  );
}
