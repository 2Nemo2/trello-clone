import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board" },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card" },
    type: {
      type: String,
      enum: ["card_assigned", "card_moved", "comment_added", "member_added"],
      required: true,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    triggeredBy: { type: String }, // aki kiváltotta az eseményt
  },
  { timestamps: true },
);
export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
