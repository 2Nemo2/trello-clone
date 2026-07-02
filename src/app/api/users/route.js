import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });
  return Response.json(users);
}
