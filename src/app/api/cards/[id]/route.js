import { connectDB } from "@/lib/mongodb";
import Card from "@/models/Card";
import Board from "@/models/Board";
import List from "@/models/List";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/activity";
import { sendNotification } from "@/lib/notify";

export async function PATCH(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const body = await request.json();
  const oldCard = await Card.findById(id);
  const card = await Card.findByIdAndUpdate(
    id,
    {
      title: body.title,
      description: body.description,
      dueDate: body.dueDate || null,
      assignees: body.assignees || [],
      labels: body.labels || [],
    },
    { returnDocument: "after" },
  );
  const list = await List.findById(card.listId);
  if (list && session) {
    const newAssignees = (body.assignees || []).filter(
      (a) =>
        !oldCard.assignees?.some((old) => old.userId?.toString() === a.userId),
    );
    if (newAssignees.length > 0) {
      const newUserIds = newAssignees
        .map((a) => a.userId)
        .filter((id) => id !== session.user.id);
      if (newUserIds.length > 0) {
        await sendNotification({
          userIds: newUserIds,
          type: "card_assigned",
          data: { triggeredBy: session.user.name, cardTitle: card.title },
          boardId: list.boardId,
          cardId: card._id,
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
      // Board lekérése az existing members ellenőrzéséhez
      const board = await Board.findById(list.boardId);
      const existingMemberIds = (board.members || []).map((m) =>
        m.userId?.toString(),
      );
      const newMembers = (body.assignees || [])
        .filter((a) => !existingMemberIds.includes(a.userId?.toString()))
        .map((a) => ({ userId: a.userId, role: "member", name: a.userName }));
      if (newMembers.length > 0) {
        await Board.findByIdAndUpdate(list.boardId, {
          $push: { members: { $each: newMembers } },
        });
      }
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
  return Response.json(card);
}

export async function DELETE(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const card = await Card.findById(id);
  const list = card ? await List.findById(card.listId) : null;
  await Card.findByIdAndDelete(id);
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
