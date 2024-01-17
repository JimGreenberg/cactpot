import dotenv from "dotenv";
dotenv.config();
import { connect, model, Schema, Types } from "mongoose";
import { Cactpot } from "../cactpot";
import { Board } from "../board";
import { BoardLine, TilePosition } from "../constants";
import * as Errors from "../error";

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
const Round = model(ROUND_MODEL_NAME, RoundSchema);

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
  leaderboardInfo: {
    score: Number,
    won: Boolean,
  },
});
const GAME_MODEL_NAME = "game2";
const Game = model(GAME_MODEL_NAME, GameSchema);

if (!process.env.MONGO_URL) throw new Error("No mongo url");
connect(process.env.MONGO_URL);

export async function createRound() {
  const board = new Board("123456789");
  try {
    const round = await new Round({
      seedString: board.seedString,
      initialReveal: board.initialReveal,
      bestScore: board.getBestScore(),
      cactpotPossible: board.getBestScore() === Board.cactpot,
    }).save();
    return round.toObject();
  } catch {
    throw new Errors.CreateError("round");
  }
}

export async function joinGame({
  roundId,
  userId,
}: {
  roundId: string;
  userId: string;
}) {
  try {
    const game = await new Game({
      round: new Types.ObjectId(roundId),
      userId,
    }).save();
    return game.toObject();
  } catch {
    throw new Errors.JoinRoundError();
  }
}

export async function takeTurn(gameId: string, turn: TilePosition | BoardLine) {
  const game = await Game.findById(gameId).populate("round");
  if (!game) throw new Errors.NotFound();
  const cactpot = Cactpot.fromMongo2(game.toObject());

  const { reveals, lineChoice } = cactpot.takeTurn(turn);
  game.reveals = reveals;
  if (lineChoice) game.lineChoice = lineChoice;
  const leaderboardInfo = cactpot.leaderboardInfo();
  if (leaderboardInfo) game.leaderboardInfo = leaderboardInfo;
  try {
    await game.save();
    return cactpot;
  } catch (e) {
    console.error(e);
    throw new Errors.UpdateGameError();
  }
}

export async function getGamesByRound(roundId: string) {
  try {
    const games = await Game.find({ round: roundId });
    return games.map((game) => Cactpot.fromMongo2(game as any));
  } catch {
    throw new Errors.NotFound();
  }
}

export async function finalizeRound(roundId: string) {
  await Round.findByIdAndUpdate(roundId, { leaderboardEnabled: true });
}

export async function getLeaderboard() {
  const pipeline = Game.aggregate()
    .lookup({
      from: ROUND_MODEL_NAME,
      localField: "round",
      foreignField: "_id",
      as: "round",
    })
    .unwind("round")
    .match({ "round.leaderboardEnabled": true })
    .group({
      _id: "$userId",
      countGames: { $count: {} },
      cactpots: {
        $sum: {
          $cond: {
            if: { $eq: ["$leaderboardInfo.score", Board.cactpot] },
            then: 1,
            else: 0,
          },
        },
      },
      cactpotsMissed: {
        $sum: {
          $cond: {
            if: {
              $and: [
                "$round.cactpotPossible",
                { $ne: ["$leaderboardInfo.score", Board.cactpot] },
              ],
            },
            then: 1,
            else: 0,
          },
        },
      },
      bestsAchieved: {
        $sum: {
          $cond: {
            if: {
              $eq: ["$leaderboardInfo.score", "$round.bestScore"],
            },
            then: 1,
            else: 0,
          },
        },
      },
      wins: { $sum: "$won" },
    });

  try {
    return pipeline.exec();
  } catch {
    throw new Errors.NotFound();
  }
}
