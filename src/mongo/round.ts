import { model, Schema } from "mongoose";
import { TilePosition } from "../constants";

const RoundSchema = new Schema({
  date: { type: Date, default: new Date() },
  seedString: { type: String, match: /[1-9]/ },
  bestScore: Number,
  cactpotPossible: Boolean,
  initialReveal: {
    type: String,
    enum: Object.values(TilePosition),
  },
  leaderboardEnabled: Boolean,
});
const ROUND_MODEL_NAME = "round2";
export default model(ROUND_MODEL_NAME, RoundSchema);
