import { model, Schema } from "mongoose";
import { BoardLine, TilePosition } from "../constants";
import Round from "./round";

const GameSchema = new Schema({
  userId: { type: String, required: true, index: true },
  reveals: {
    type: [
      {
        type: String,
        enum: Object.values(TilePosition),
      },
    ],
    validate: (v: string[]) => v.length <= 3,
  },
  lineChoice: {
    type: String,
    enum: Object.values(BoardLine),
  },
  round: {
    type: Schema.ObjectId,
    ref: Round,
    index: true,
  },
  score: Number,
  didPlayOptimally: Boolean,
});
GameSchema.index({ userId: 1, round: 1 }, { unique: true });

const GAME_MODEL_NAME = "game";
export default model(GAME_MODEL_NAME, GameSchema);
