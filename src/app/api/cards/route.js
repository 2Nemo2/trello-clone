import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/activity";
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get("listId");
  const cards = await prisma.card.findMany({
    where: { listId },
    include: {
      assignees: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { order: "asc" },
  });
  // labels JSON string → tömb
  const parsed = cards.map((c) => ({
    ...c,
    labels: JSON.parse(c.labels || "[]"),
  }));
  return Response.json(parsed);
}
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const count = await prisma.card.count({
    where: { listId: body.listId },
  });
  const card = await prisma.card.create({
    data: {
      title: body.title,
      listId: body.listId,
      order: count,
    },
    include: { assignees: true, comments: true },
  });
  if (session) {
    const list = await prisma.list.findUnique({ where: { id: body.listId } });
    if (list) {
      await logActivity({
        boardId: list.boardId,
        userId: session.user.id,
        userName: session.user.name,
        type: "card_created",
        data: { cardTitle: body.title, listTitle: list.title },
      });
    }
  }
  return Response.json({ ...card, labels: [] }, { status: 201 });
}
