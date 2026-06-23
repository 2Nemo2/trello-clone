import mongoose from "mongoose";
const ActivitySchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "card_created",
        "card_moved",
        "card_deleted",
        "card_updated",
        "comment_added",
        "list_created",
        "list_deleted",
        "member_added",
      ],
      required: true,
    },
    data: { type: Object, default: {} }, // extra infók, pl. kártya neve, lista neve
  },
  { timestamps: true },
);
export default mongoose.models.Activity ||
  mongoose.model("Activity", ActivitySchema);
