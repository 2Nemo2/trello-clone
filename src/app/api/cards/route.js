import { connectDB } from "@/lib/mongodb";
import Card from "@/models/Card";
import List from "@/models/List";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/activity";
export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get("listId");
  const cards = await Card.find({ listId }).sort({ order: 1 });
  return Response.json(cards);
}
export async function POST(request) {
  await connectDB();
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const count = await Card.countDocuments({ listId: body.listId });
  const card = await Card.create({
    title: body.title,
    listId: body.listId,
    order: count,
  });
  // Megkeressük a boardId-t
  const list = await List.findById(body.listId);
  if (list && session) {
    await logActivity({
      boardId: list.boardId,
      userId: session.user.id,
      userName: session.user.name,
      type: "card_created",
      data: { cardTitle: body.title, listTitle: list.title },
    });
  }
  return Response.json(card, { status: 201 });
}
