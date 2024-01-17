import dotenv from "dotenv";
dotenv.config();
import { connect, model, Schema, Types, PipelineStage } from "mongoose";
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
  score: Number,
});
const GAME_MODEL_NAME = "game2";
const Game = model(GAME_MODEL_NAME, GameSchema);

if (!process.env.MONGO_URL) throw new Error("No mongo url");
connect(process.env.MONGO_URL);

export async function createRound() {
  const board = new Board("123456789", TilePosition.CENTER);
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
  const score = cactpot.getScore();
  if (score) game.score = score;
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

function _roundsWithWinningScore(): PipelineStage.Lookup["$lookup"]["pipeline"] {
  return Round.aggregate()
    .lookup({
      from: GAME_MODEL_NAME,
      localField: "_id",
      foreignField: "round",
      as: "games",
    })
    .addFields({
      bestPlayerScore: { $max: "$games.score" },
    })
    .project({
      _id: 1,
      bestScore: 1,
      bestPlayerScore: 1,
      cactpotPossible: 1,
      leaderboardEnabled: 1,
    })
    .pipeline() as PipelineStage.Lookup["$lookup"]["pipeline"];
}

export async function getLeaderboard() {
  const pipeline = Game.aggregate()
    .lookup({
      from: ROUND_MODEL_NAME,
      localField: "round",
      foreignField: "_id",
      pipeline: _roundsWithWinningScore(),
      as: "round",
    })
    .unwind("round")
    .match({ "round.leaderboardEnabled": true })
    .group({
      _id: "$userId",
      countGames: { $count: {} },
      cactpots: {
        $sum: {
          $toInt: { $eq: ["$score", Board.cactpot] },
        },
      },
      cactpotsMissed: {
        $sum: {
          $toInt: {
            $and: [
              "$round.cactpotPossible",
              { $ne: ["$score", Board.cactpot] },
            ],
          },
        },
      },
      bestsAchieved: {
        $sum: {
          $toInt: {
            $eq: ["$score", "$round.bestScore"],
          },
        },
      },
      wins: {
        $sum: {
          $toInt: {
            $eq: ["$score", "$round.bestPlayerScore"],
          },
        },
      },
    });

  try {
    return pipeline.exec();
  } catch {
    throw new Errors.NotFound();
  }
}

async function runner() {
  const jim = "U018E65NULA";
  // const round = await createRound();
  // console.log("round", round);
  // const game = await joinGame({ roundId: String(round._id), userId: jim });
  // console.log("game", game);
  // const turn1 = await takeTurn(String(game._id), TilePosition.BOTTOM_LEFT);
  // console.log("turn1", turn1);
  // const turn2 = await takeTurn(String(game._id), TilePosition.BOTTOM_MIDDLE);
  // console.log("turn2", turn2);
  // const turn3 = await takeTurn(String(game._id), TilePosition.BOTTOM_RIGHT);
  // console.log("turn3", turn3);
  // const turn4 = await takeTurn(String(game._id), BoardLine.TOP_ROW);
  // console.log("turn4", turn4);
  // await finalizeRound(String(round._id));
  // const gamesByRound = await getGamesByRound(String(round._id));
  // console.log("gamesByRound", gamesByRound);
  const leaderboard = await getLeaderboard();
  console.log("leaderboard", leaderboard);
}
runner();
