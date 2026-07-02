import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getUserRole, canEditBoard, canDeleteBoard } from "@/lib/roles";
export async function GET(request, { params }) {
  const { id } = await params;
  const board = await prisma.board.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!board)
    return Response.json({ error: "Nincs ilyen board" }, { status: 404 });
  return Response.json(board);
}
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const board = await prisma.board.findUnique({
    where: { id },
    include: { members: true },
  });
  const role = getUserRole(board, session.user.id);
  if (!canEditBoard(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  const updated = await prisma.board.update({
    where: { id },
    data: { title: body.title, background: body.background },
  });
  return Response.json(updated);
}
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const board = await prisma.board.findUnique({
    where: { id },
    include: { members: true },
  });
  const role = getUserRole(board, session.user.id);
  if (!canDeleteBoard(role)) {
    return Response.json(
      { error: "Csak a tulajdonos törölheti a boardot!" },
      { status: 403 },
    );
  }
  // Cascade törlés — Prisma automatikusan törli a listákat, kártyákat is
  await prisma.board.delete({ where: { id } });
  return Response.json({ success: true });
}
