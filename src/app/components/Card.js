"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const LABEL_COLORS = {
  Fontos: "bg-red-500",
  Haladó: "bg-orange-400",
  Folyamatban: "bg-yellow-400",
  Kész: "bg-green-500",
  Kérdés: "bg-blue-500",
  Ötlet: "bg-purple-500",
};
export default function Card({ card, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
  const isToday =
    card.dueDate &&
    new Date(card.dueDate).toDateString() === new Date().toDateString();
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-gray-700 hover:bg-gray-600 rounded-xl shadow group transition cursor-pointer"
    >
      {/* Címkék */}
      {card.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pt-2.5">
          {card.labels.map((label) => (
            <span
              key={label}
              className={`text-xs text-white px-2 py-0.5 rounded-full font-medium ${LABEL_COLORS[label] || "bg-gray-500"}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
      <div className="px-3 py-2.5 flex items-start gap-2">
        {/* Húzható terület */}
        <div {...listeners} className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-snug">
            {card.title}
          </p>
          {card.description && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-2">
              {card.description}
            </p>
          )}
        </div>
        {/* Szerkesztés gomb */}
        <button
          onClick={() => onClick(card)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition flex-shrink-0 p-0.5 rounded"
        >
          ✎
        </button>
      </div>
      {/* Meta adatok */}
      {(card.dueDate ||
        card.assignees?.length > 0 ||
        card.comments?.length > 0) && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
          {card.dueDate && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                isOverdue
                  ? "bg-red-500/20 text-red-400"
                  : isToday
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-green-500/20 text-green-400"
              }`}
            >
              📅 {new Date(card.dueDate).toLocaleDateString("hu-HU")}
            </span>
          )}
          {card.assignees?.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              👥 {card.assignees.length}
            </span>
          )}
          {card.comments?.length > 0 && (
            <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              💬 {card.comments.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
