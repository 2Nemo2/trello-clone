import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  name: { type: String },
  email: { type: String },
});
const BoardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    background: { type: String, default: "#0079bf" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [MemberSchema],
  },
  { timestamps: true },
);
export default mongoose.models.Board || mongoose.model("Board", BoardSchema);
