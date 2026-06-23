import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  }
  // Saját boardok + ahol tag
  const boards = await Board.find({
    $or: [{ userId: session.user.id }, { "members.userId": session.user.id }],
  }).sort({ createdAt: -1 });
  return Response.json(boards);
}

export async function POST(request) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  }
  const body = await request.json();
  const board = await Board.create({
    title: body.title,
    background: body.background || "#0079bf",
    userId: session.user.id,
  });
  return Response.json(board, { status: 201 });
}
