import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import List from "@/models/List";
import Card from "@/models/Card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getUserRole, canEditBoard, canDeleteBoard } from "@/lib/roles";
export async function GET(request, { params }) {
  await connectDB();
  const { id } = await params;
  const board = await Board.findById(id);
  if (!board)
    return Response.json({ error: "Nincs ilyen board" }, { status: 404 });
  return Response.json(board);
}
export async function PATCH(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const board = await Board.findById(id);
  const role = getUserRole(board, session.user.id);
  if (!canEditBoard(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  const body = await request.json();
  const updated = await Board.findByIdAndUpdate(
    id,
    { title: body.title, background: body.background },
    { returnDocument: "after" },
  );
  return Response.json(updated);
}
export async function DELETE(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const board = await Board.findById(id);
  const role = getUserRole(board, session.user.id);
  if (!canDeleteBoard(role)) {
    return Response.json(
      { error: "Csak a tulajdonos törölheti a boardot!" },
      { status: 403 },
    );
  }
  const lists = await List.find({ boardId: id });
  const listIds = lists.map((l) => l._id);
  await Card.deleteMany({ listId: { $in: listIds } });
  await List.deleteMany({ boardId: id });
  await Board.findByIdAndDelete(id);
  return Response.json({ success: true });
}
