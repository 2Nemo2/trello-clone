"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white rounded p-2 shadow text-sm text-gray-800 cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start gap-1">
        {/* Húzható terület */}
        <span {...listeners} className="flex-1">
          {card.title}
          {card.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {card.description}
            </p>
          )}
          {/* Címkék */}
          {card.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {card.labels.map((label) => {
                const found = [
                  { text: "Fontos", color: "bg-red-500" },
                  { text: "Haladó", color: "bg-orange-400" },
                  { text: "Folyamatban", color: "bg-yellow-400" },
                  { text: "Kész", color: "bg-green-500" },
                  { text: "Kérdés", color: "bg-blue-500" },
                  { text: "Ötlet", color: "bg-purple-500" },
                ].find((l) => l.text === label);
                return (
                  <span
                    key={label}
                    className={`text-xs text-white px-1.5 py-0.5 rounded-full font-medium ${found?.color || "bg-gray-400"}`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}
          {/* Határidő + assignee-k */}
          <div className="flex gap-2 mt-1 flex-wrap items-center">
            {card.dueDate && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  new Date(card.dueDate) < new Date()
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                📅 {new Date(card.dueDate).toLocaleDateString("hu-HU")}
              </span>
            )}
            {card.assignees?.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                👥 {card.assignees.map((a) => a.userName).join(", ")}
              </span>
            )}
          </div>
        </span>
        {/* Kattintható gomb a részletekhez */}
        <button
          onClick={() => onClick(card)}
          className="text-gray-400 hover:text-gray-600 text-xs px-1 shrink-0"
        >
          ✎
        </button>
      </div>
    </div>
  );
}
