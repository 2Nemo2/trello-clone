import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getUserRole, canDeleteList } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const list = await prisma.list.findUnique({
    where: { id },
    include: { board: { include: { members: true } } },
  });
  if (!list) return Response.json({ error: "Nem található!" }, { status: 404 });
  const role = getUserRole(list.board, session.user.id);
  if (!canDeleteList(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  // Cascade törlés automatikus a sémában
  await prisma.list.delete({ where: { id } });
  await logActivity({
    boardId: list.boardId,
    userId: session.user.id,
    userName: session.user.name,
    type: "list_deleted",
    data: { listTitle: list.title },
  });
  return Response.json({ success: true });
}
