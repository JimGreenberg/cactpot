import dotenv from "dotenv";
dotenv.config();
import mongoose, { connect, Types, PipelineStage } from "mongoose";
import { Cactpot } from "../cactpot";
import { Board } from "../board";
import { BoardLine, TilePosition } from "../constants";
import * as Errors from "../error";
import Game from "./game";
import Round from "./round";

if (!process.env.MONGO_URL) throw new Error("No mongo url");
connect(process.env.MONGO_URL);

export async function createRound(channelId: string): Promise<string> {
  const board = new Board();
  try {
    const round = await new Round({
      channelId,
      seedString: board.seedString,
      initialReveal: board.initialReveal,
      bestScore: board.bestScore,
      cactpotPossible: board.cactpotPossible,
    }).save();
    console.log(String(round._id));
    return String(round._id);
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
  console.log(roundId);
  const round = new Types.ObjectId(roundId);
  console.log(round);
  try {
    const game = await new Game({
      round,
      userId,
    }).save();
    return game.toObject();
  } catch (e) {
    throw new Errors.JoinRoundError(String(e));
  }
}

export async function takeTurn(gameId: string, turn: TilePosition | BoardLine) {
  const game = await Game.findById(gameId).populate("round");
  if (!game) throw new Errors.NotFound();
  const cactpot = Cactpot.fromMongo(game.toObject());

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

export async function getGameById(gameId: string) {
  try {
    const game = await Game.findById(gameId).populate("round");
    return Cactpot.fromMongo(game!.toObject());
  } catch {
    throw new Errors.NotFound("game");
  }
}

export async function getGamesByRound(roundId: string) {
  try {
    const games = await Game.find({ round: roundId })
      .sort({ score: -1 })
      .populate("round");
    return games.map((game) => Cactpot.fromMongo(game.toObject()));
  } catch {
    throw new Errors.NotFound("roundId");
  }
}

export async function enableLeaderboardForRound(roundId: string) {
  await Round.findByIdAndUpdate(roundId, { leaderboardEnabled: true });
}

function _roundsWithWinningScore(
  channelId: string
): PipelineStage.Lookup["$lookup"]["pipeline"] {
  return Round.aggregate()
    .match({ channelId, leaderboardEnabled: true })
    .lookup({
      from: Game.collection.name,
      localField: "_id",
      foreignField: "round",
      as: "games",
    })
    .match({ "games.0": { $exists: true } })
    .addFields({
      bestPlayerScore: { $max: "$games.score" },
    })
    .project({
      _id: 1,
      bestScore: 1,
      bestPlayerScore: 1,
      cactpotPossible: 1,
    })
    .pipeline() as PipelineStage.Lookup["$lookup"]["pipeline"];
}

export async function getLeaderboard(channelId: string): Promise<
  {
    userId: string;
    countGames: number;
    cactpots: number;
    cactpotsMissed: number;
    bestsAchieved: number;
    wins: number;
  }[]
> {
  const pipeline = Game.aggregate()
    .lookup({
      from: Round.collection.name,
      localField: "round",
      foreignField: "_id",
      pipeline: _roundsWithWinningScore(channelId),
      as: "round",
    })
    .unwind("round")
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
    })
    .addFields({
      userId: "$_id",
    })
    .sort({
      wins: -1,
    });

  try {
    return pipeline.exec();
  } catch {
    throw new Errors.NotFound();
  }
}

// Migrations

export async function syncIndexes() {
  await mongoose.syncIndexes();
}
