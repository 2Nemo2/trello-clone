import { connectDB } from "@/lib/mongodb";
import Card from "@/models/Card";
import List from "@/models/List";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/activity";

export async function POST(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const card = await Card.findByIdAndUpdate(
    id,
    {
      $push: {
        comments: {
          text: body.text,
          userId: session.user.id,
          userName: session.user.name,
        },
      },
    },
    { returnDocument: "after" },
  );
  // Aktivitás logolás
  const list = await List.findById(card.listId);
  if (list) {
    await logActivity({
      boardId: list.boardId,
      userId: session.user.id,
      userName: session.user.name,
      type: "comment_added",
      data: { cardTitle: card.title, text: body.text },
    });
  }

  if (card.assignees?.length > 0) {
    const otherAssigneeIds = card.assignees
      .map((a) => a.userId?.toString())
      .filter((id) => id !== session.user.id);
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
        cardId: card._id,
      });
    }
  }

  return Response.json(card);
}
export async function DELETE(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const { commentId } = await request.json();
  const card = await Card.findByIdAndUpdate(
    id,
    { $pull: { comments: { _id: commentId, userId: session.user.id } } },
    { returnDocument: "after" },
  );
  return Response.json(card);
}
