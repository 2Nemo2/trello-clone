import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const activities = await prisma.activity.findMany({
    where: { boardId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  // data mező JSON string → objektum
  const parsed = activities.map((a) => ({
    ...a,
    data: JSON.parse(a.data),
  }));
  return Response.json(parsed);
}
