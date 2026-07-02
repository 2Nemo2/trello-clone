import prisma from "@/lib/prisma";

export async function logActivity({
  boardId,
  userId,
  userName,
  type,
  data = {},
}) {
  await prisma.activity.create({
    data: {
      boardId,
      userId,
      userName,
      type,
      data: JSON.stringify(data),
    },
  });
}
