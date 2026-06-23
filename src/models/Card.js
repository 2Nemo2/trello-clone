import mongoose from "mongoose";
const CommentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
  },
  { timestamps: true },
);
const CardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },
    order: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    assignees: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String },
      },
    ],
    labels: [{ type: String }],
    comments: [CommentSchema],
  },
  { timestamps: true },
);
export default mongoose.models.Card || mongoose.model("Card", CardSchema);
