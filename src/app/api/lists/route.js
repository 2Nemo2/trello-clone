import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/activity";
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId");
  const lists = await prisma.list.findMany({
    where: { boardId },
    orderBy: { order: "asc" },
  });
  return Response.json(lists);
}
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const count = await prisma.list.count({
    where: { boardId: body.boardId },
  });
  const list = await prisma.list.create({
    data: {
      title: body.title,
      boardId: body.boardId,
      order: count,
    },
  });
  if (session) {
    await logActivity({
      boardId: body.boardId,
      userId: session.user.id,
      userName: session.user.name,
      type: "list_created",
      data: { listTitle: body.title },
    });
  }
  return Response.json(list, { status: 201 });
}
