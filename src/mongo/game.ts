import dotenv from "dotenv";
dotenv.config();
import { connect, model, Schema, Types } from "mongoose";
import { Board } from "../board";
import { BoardLine, TilePosition } from "../constants";
import * as Errors from "../error";

const GameSchema = new Schema({
  userId: String,
  roundId: Schema.ObjectId,
  date: { type: Date, default: new Date() },
  seedString: { type: String, match: /[1-9]/ },
  firstReveal: { type: Number, enum: TilePosition },
  secondReveal: { type: Number, enum: TilePosition },
  thirdReveal: { type: Number, enum: TilePosition },
  lineChoice: { type: String, enum: BoardLine },
});
GameSchema.index({ userId: 1, roundId: 1 }, { unique: true });

const GAME_MODEL_NAME = "game";
const Game = model(GAME_MODEL_NAME, GameSchema);
if (!process.env.MONGO_URL) throw new Error("No mongo url");
connect(process.env.MONGO_URL);

export async function createGame(userId: string) {
  try {
    return new Game({
      userId,
      seedString: Board.randomSeedString(),
      roundId: new Types.ObjectId(),
    }).save();
  } catch {
    throw new Errors.CreateGameError();
  }
}

export async function joinGame({
  userId,
  gameId,
}: {
  userId: string;
  gameId: Types.ObjectId;
}) {
  const original = await Game.findById(gameId);
  if (!original) throw new Errors.ErrorJoiningGame();
  try {
    return new Game({
      userId,
      seedString: original.seedString,
      roundId: original.roundId,
    }).save();
  } catch {
    throw new Errors.CreateGameError();
  }
}

type Turn = {
  firstReveal?: TilePosition;
  secondReveal?: TilePosition;
  thirdReveal?: TilePosition;
  lineChoice?: BoardLine;
};

export async function takeTurn(
  gameId: Types.ObjectId,
  { firstReveal, secondReveal, thirdReveal, lineChoice }: Turn
) {
  const game = await Game.findById(gameId);
  if (!game) throw new Errors.NotFound();
  if (firstReveal) game.firstReveal = firstReveal;
  if (secondReveal) game.secondReveal = secondReveal;
  if (thirdReveal) game.thirdReveal = thirdReveal;
  if (lineChoice) game.lineChoice = lineChoice;
  try {
    return game.save();
  } catch {
    throw new Errors.UpdateGameError();
  }
}

export async function getRound(roundId: Types.ObjectId) {
  try {
    return Game.find({ roundId });
  } catch {
    throw new Errors.NotFound();
  }
}
