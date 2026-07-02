import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/activity";
import { sendNotification } from "@/lib/notify";
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const body = await request.json();
  const oldCard = await prisma.card.findUnique({
    where: { id },
    include: { assignees: true },
  });
  // Assignee-k frissítése: töröljük a régieket, hozzáadjuk az újakat
  await prisma.cardAssignee.deleteMany({ where: { cardId: id } });
  const card = await prisma.card.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      labels: JSON.stringify(body.labels || []),
      assignees: {
        create: (body.assignees || []).map((a) => ({
          userId: a.userId,
          userName: a.userName,
        })),
      },
    },
    include: {
      assignees: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  const list = await prisma.list.findUnique({ where: { id: card.listId } });
  if (list && session) {
    const oldAssigneeIds = oldCard.assignees.map((a) => a.userId);
    const newAssignees = (body.assignees || []).filter(
      (a) => !oldAssigneeIds.includes(a.userId),
    );
    if (newAssignees.length > 0) {
      const newUserIds = newAssignees
        .map((a) => a.userId)
        .filter((uid) => uid !== session.user.id);
      if (newUserIds.length > 0) {
        await sendNotification({
          userIds: newUserIds,
          type: "card_assigned",
          data: { triggeredBy: session.user.name, cardTitle: card.title },
          boardId: list.boardId,
          cardId: card.id,
        });
      }
      // Új assignee-kat board memberként is hozzáadjuk
      const board = await prisma.board.findUnique({
        where: { id: list.boardId },
        include: { members: true },
      });
      const existingMemberIds = board.members.map((m) => m.userId);
      const newMembers = newAssignees.filter(
        (a) =>
          !existingMemberIds.includes(a.userId) && a.userId !== board.userId,
      );
      for (const member of newMembers) {
        const user = await prisma.user.findUnique({
          where: { id: member.userId },
          select: { name: true, email: true },
        });
        await prisma.boardMember.create({
          data: {
            userId: member.userId,
            boardId: list.boardId,
            role: "member",
            name: user?.name,
            email: user?.email,
          },
        });
      }
      await logActivity({
        boardId: list.boardId,
        userId: session.user.id,
        userName: session.user.name,
        type: "member_added",
        data: {
          cardTitle: card.title,
          addedUsers: newAssignees.map((a) => a.userName),
        },
      });
    } else {
      await logActivity({
        boardId: list.boardId,
        userId: session.user.id,
        userName: session.user.name,
        type: "card_updated",
        data: { cardTitle: card.title },
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
  const { id } = await params;
  const card = await prisma.card.findUnique({ where: { id } });
  const list = card
    ? await prisma.list.findUnique({ where: { id: card.listId } })
    : null;
  await prisma.card.delete({ where: { id } });
  if (list && session) {
    await logActivity({
      boardId: list.boardId,
      userId: session.user.id,
      userName: session.user.name,
      type: "card_deleted",
      data: { cardTitle: card.title, listTitle: list.title },
    });
  }
  return Response.json({ success: true });
}
