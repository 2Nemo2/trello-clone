import { Resend } from "resend";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";
const resend = new Resend(process.env.RESEND_API_KEY);
// Értesítés szövegek
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
// Email HTML sablon
function emailTemplate(message, boardId) {
  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0079bf;">🎯 Trello Klón — Értesítés</h2>
      <p style="color: #333; font-size: 16px;">${message}</p>
      <a
        href="${process.env.NEXTAUTH_URL}/board/${boardId}"
        style="display:inline-block; margin-top: 16px; background:#0079bf; color:white; padding:10px 20px; border-radius:8px; text-decoration:none;"
      >
        Board megnyitása
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        Ha nem szeretnél több értesítést kapni, módosítsd a beállításaidat.
      </p>
    </div>
  `;
}
// Fő értesítő függvény
export async function sendNotification({
  userIds,
  type,
  data,
  boardId,
  cardId,
}) {
  await connectDB();
  const message = getNotificationMessage(type, data);
  // In-app értesítések létrehozása
  const notifications = userIds.map((userId) => ({
    userId,
    boardId,
    cardId,
    type,
    message,
    triggeredBy: data.triggeredBy,
  }));
  await Notification.insertMany(notifications);
  // Email küldés minden érintett usernek
  const users = await User.find(
    { _id: { $in: userIds } },
    { email: 1, name: 1 },
  );
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
      // Ha az email nem megy ki, az in-app értesítés marad
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
          <p style="color: #333;">Szia ${name}!</p>
          <p style="color: #333;">Kattints az alábbi gombra az email címed hitelesítéséhez:</p>
          <a
            href="${verifyUrl}"
            style="display:inline-block; margin-top: 16px; background:#0079bf; color:white; padding:10px 20px; border-radius:8px; text-decoration:none;"
          >
            Email hitelesítése
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            Ha nem te regisztráltál, hagyd figyelmen kívül ezt az emailt.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Hitelesítő email küldési hiba:", err);
  }
}
