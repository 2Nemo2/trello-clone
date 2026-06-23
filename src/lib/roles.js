// Meghatározza a user szerepét egy boardon
export function getUserRole(board, userId) {
  if (!board || !userId) return null;
  if (board.userId?.toString() === userId.toString()) return "owner";
  const member = board.members?.find(
    (m) => m.userId?.toString() === userId.toString(),
  );
  return member?.role || null;
}
// Jogosultság ellenőrzések
export function canEditBoard(role) {
  return ["owner", "admin"].includes(role);
}
export function canDeleteBoard(role) {
  return role === "owner";
}
export function canManageMembers(role) {
  return ["owner", "admin"].includes(role);
}
export function canDeleteList(role) {
  return ["owner", "admin"].includes(role);
}
export function canDeleteCard(role) {
  return ["owner", "admin"].includes(role);
}
