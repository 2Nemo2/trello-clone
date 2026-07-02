import { Resend } from "resend";
import prisma from "@/lib/prisma";
const resend = new Resend(process.env.RESEND_API_KEY);
function getNotificationMessage(type, data) {
  switch (type) {
    case "card_assigned":
      return `${data.triggeredBy} hozzárendelt a "${data.cardTitle}" kártyához`;
    case "card_moved":
      return `${data.triggeredBy} áthelyezte a "${data.cardTitle}" kártyát`;
    case "comment_added":
      return `${data.triggeredBy} kommentelt a "${data.cardTitle}" kártyán: "${data.text}"`;
    case "member_added":
      return `${data.triggeredBy} hozzáadott a "${data.boardTitle}" boardhoz`;
    default:
      return "Új értesítés érkezett";
  }
}
function emailTemplate(message, boardId) {
  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0079bf;">🎯 Trello Klón — Értesítés</h2>
      <p style="color: #333; font-size: 16px;">${message}</p>
      <a href="${process.env.NEXTAUTH_URL}/board/${boardId}"
        style="display:inline-block; margin-top: 16px; background:#0079bf; color:white; padding:10px 20px; border-radius:8px; text-decoration:none;">
        Board megnyitása
      </a>
    </div>
  `;
}
export async function sendNotification({
  userIds,
  type,
  data,
  boardId,
  cardId,
}) {
  const message = getNotificationMessage(type, data);
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      boardId: boardId?.toString() || null,
      cardId: cardId?.toString() || null,
      type,
      message,
      triggeredBy: data.triggeredBy,
    })),
  });
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { email: true, name: true },
  });
  for (const user of users) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: `🎯 Trello Klón — ${message}`,
        html: emailTemplate(message, boardId),
      });
    } catch (err) {
      console.error("Email küldési hiba:", err);
    }
  }
}
export async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}`;
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "🎯 Trello Klón — Email hitelesítés",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #0079bf;">🎯 Trello Klón</h2>
          <p>Szia ${name}!</p>
          <p>Kattints az alábbi gombra az email címed hitelesítéséhez:</p>
          <a href="${verifyUrl}"
            style="display:inline-block; margin-top: 16px; background:#0079bf; color:white; padding:10px 20px; border-radius:8px; text-decoration:none;">
            Email hitelesítése
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Hitelesítő email küldési hiba:", err);
  }
}
