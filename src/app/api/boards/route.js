import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(boards);
}
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const body = await request.json();
  const board = await prisma.board.create({
    data: {
      title: body.title,
      background: body.background || "#0079bf",
      userId: session.user.id,
    },
  });
  return Response.json(board, { status: 201 });
}
