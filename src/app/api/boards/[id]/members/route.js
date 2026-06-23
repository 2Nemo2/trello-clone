import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getUserRole, canManageMembers } from "@/lib/roles";
import { sendNotification } from "@/lib/notify";
// GET — board tagjainak lekérése
export async function GET(request, { params }) {
  await connectDB();
  const { id } = await params;
  const board = await Board.findById(id);
  if (!board)
    return Response.json({ error: "Nem található!" }, { status: 404 });
  return Response.json(board.members);
}
// POST — új tag hozzáadása email alapján
export async function POST(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const board = await Board.findById(id);
  const role = getUserRole(board, session.user.id);
  if (!canManageMembers(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  const body = await request.json();
  // User keresése email alapján
  const user = await User.findOne({ email: body.email });
  if (!user)
    return Response.json(
      { error: "Nincs ilyen felhasználó!" },
      { status: 404 },
    );
  // Már tag?
  const alreadyMember = board.members?.some(
    (m) => m.userId?.toString() === user._id.toString(),
  );
  if (alreadyMember || board.userId?.toString() === user._id.toString()) {
    return Response.json(
      { error: "Ez a felhasználó már tag!" },
      { status: 400 },
    );
  }
  const updated = await Board.findByIdAndUpdate(
    id,
    {
      $push: {
        members: {
          userId: user._id,
          role: body.role || "member",
          name: user.name,
          email: user.email,
        },
      },
    },
    { returnDocument: "after" },
  );
  // Értesítés küldése
  await sendNotification({
    userIds: [user._id.toString()],
    type: "member_added",
    data: { triggeredBy: session.user.name, boardTitle: board.title },
    boardId: id,
  });
  return Response.json(updated.members);
}
// PATCH — tag role-jának módosítása
export async function PATCH(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const board = await Board.findById(id);
  const role = getUserRole(board, session.user.id);
  if (!canManageMembers(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  const body = await request.json();
  const updated = await Board.findOneAndUpdate(
    { _id: id, "members.userId": body.userId },
    { $set: { "members.$.role": body.role } },
    { returnDocument: "after" },
  );
  return Response.json(updated.members);
}
// DELETE — tag eltávolítása
export async function DELETE(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const board = await Board.findById(id);
  const role = getUserRole(board, session.user.id);
  if (!canManageMembers(role)) {
    return Response.json({ error: "Nincs jogosultságod!" }, { status: 403 });
  }
  const { userId } = await request.json();
  const updated = await Board.findByIdAndUpdate(
    id,
    { $pull: { members: { userId } } },
    { returnDocument: "after" },
  );
  return Response.json(updated.members);
}
