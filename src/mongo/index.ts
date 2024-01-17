import dotenv from "dotenv";
dotenv.config();
import { connect, model, Schema, Types, PipelineStage } from "mongoose";
import { Cactpot } from "../cactpot";
import { Board } from "../board";
import { BoardLine, TilePosition } from "../constants";
import * as Errors from "../error";
import Game from "./game";
import Round from "./round";

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

export async function getGamesByRound(roundId: string) {
  try {
    const games = await Game.find({ round: roundId });
    return games.map((game) => Cactpot.fromMongo(game as any));
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
      from: Game.name,
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
      from: Round.name,
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
