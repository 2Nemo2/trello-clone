import { connectDB } from "@/lib/mongodb";
import List from "@/models/List";
import { logActivity } from "@/lib/activity";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET /api/lists?boardId=xxx → egy board listáinak lekérése
export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId");
  const lists = await List.find({ boardId }).sort({ order: 1 });
  return Response.json(lists);
}
// POST /api/lists → új lista létrehozása
export async function POST(request) {
  await connectDB();
  const body = await request.json();
  // Megnézzük, hány lista van már ezen a boardon, hogy a végére kerüljön
  const count = await List.countDocuments({ boardId: body.boardId });
  const list = await List.create({
    title: body.title,
    boardId: body.boardId,
    order: count,
  });
  const session = await getServerSession(authOptions);
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
