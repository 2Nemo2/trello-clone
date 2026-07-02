import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getUserRole, canManageMembers } from "@/lib/roles";
import { sendNotification } from "@/lib/notify";
export async function GET(request, { params }) {
  const { id } = await params;
  const members = await prisma.boardMember.findMany({
    where: { boardId: id },
  });
  return Response.json(members);
}
export async function POST(request, { params }) {
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
  if (!canManageMembers(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (!user)
    return Response.json(
      { error: "Nincs ilyen felhasználó!" },
      { status: 404 },
    );
  const alreadyMember = board.members.some((m) => m.userId === user.id);
  if (alreadyMember || board.userId === user.id) {
    return Response.json(
      { error: "Ez a felhasználó már tag!" },
      { status: 400 },
    );
  }
  await prisma.boardMember.create({
    data: {
      userId: user.id,
      boardId: id,
      role: body.role || "member",
      name: user.name,
      email: user.email,
    },
  });
  await sendNotification({
    userIds: [user.id],
    type: "member_added",
    data: { triggeredBy: session.user.name, boardTitle: board.title },
    boardId: id,
  });
  const members = await prisma.boardMember.findMany({ where: { boardId: id } });
  return Response.json(members);
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
  if (!canManageMembers(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  await prisma.boardMember.updateMany({
    where: { boardId: id, userId: body.userId },
    data: { role: body.role },
  });
  const members = await prisma.boardMember.findMany({ where: { boardId: id } });
  return Response.json(members);
}
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const { userId } = await request.json();
  const board = await prisma.board.findUnique({
    where: { id },
    include: { members: true },
  });
  const role = getUserRole(board, session.user.id);
  if (!canManageMembers(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  await prisma.boardMember.deleteMany({
    where: { boardId: id, userId },
  });
  const members = await prisma.boardMember.findMany({ where: { boardId: id } });
  return Response.json(members);
}
