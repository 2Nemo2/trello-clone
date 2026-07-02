import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/activity";
import { sendNotification } from "@/lib/notify";
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const comment = await prisma.comment.create({
    data: {
      text: body.text,
      userId: session.user.id,
      userName: session.user.name,
      cardId: id,
    },
  });
  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      assignees: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  const list = await prisma.list.findUnique({ where: { id: card.listId } });
  if (list) {
    await logActivity({
      boardId: list.boardId,
      userId: session.user.id,
      userName: session.user.name,
      type: "comment_added",
      data: { cardTitle: card.title, text: body.text },
    });
    // Értesítés az assignee-knak
    const otherAssigneeIds = card.assignees
      .map((a) => a.userId)
      .filter((uid) => uid !== session.user.id);
    if (otherAssigneeIds.length > 0) {
      await sendNotification({
        userIds: otherAssigneeIds,
        type: "comment_added",
        data: {
          triggeredBy: session.user.name,
          cardTitle: card.title,
          text: body.text,
        },
        boardId: list.boardId,
        cardId: id,
      });
    }
  }
  return Response.json({
    ...card,
    labels: JSON.parse(card.labels || "[]"),
  });
}
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const { commentId } = await request.json();
  await prisma.comment.deleteMany({
    where: { id: commentId, userId: session.user.id },
  });
  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      assignees: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  return Response.json({
    ...card,
    labels: JSON.parse(card.labels || "[]"),
  });
}
