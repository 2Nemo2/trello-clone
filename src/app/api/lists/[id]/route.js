import { connectDB } from "@/lib/mongodb";
import List from "@/models/List";
import Card from "@/models/Card";
import Board from "@/models/Board";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getUserRole, canDeleteList } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
export async function DELETE(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const list = await List.findById(id);
  if (!list) return Response.json({ error: "Nem található!" }, { status: 404 });
  const board = await Board.findById(list.boardId);
  const role = getUserRole(board, session.user.id);
  if (!canDeleteList(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  await Card.deleteMany({ listId: id });
  await List.findByIdAndDelete(id);
  await logActivity({
    boardId: list.boardId,
    userId: session.user.id,
    userName: session.user.name,
    type: "list_deleted",
    data: { listTitle: list.title },
  });
  return Response.json({ success: true });
}
