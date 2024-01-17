import { model, Schema } from "mongoose";
import { TilePosition } from "../constants";

const RoundSchema = new Schema({
  channelId: { type: String, required: true },
  date: { type: Date, default: new Date() },
  seedString: { type: String, match: /[1-9]/, required: true },
  bestScore: { type: Number, required: true },
  cactpotPossible: { type: Boolean, required: true },
  initialReveal: {
    type: String,
    enum: Object.values(TilePosition),
    required: true,
  },
  leaderboardEnabled: Boolean,
});
const ROUND_MODEL_NAME = "round";
export default model(ROUND_MODEL_NAME, RoundSchema);
