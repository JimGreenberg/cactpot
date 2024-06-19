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
  const round = new Types.ObjectId(roundId);
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
  if (!turn) {
    throw new Error(); // TODO too lazy to refactor this DB method
  }
  const game = await Game.findById(gameId).populate("round");
  if (!game) throw new Errors.NotFound();
  const cactpot = Cactpot.fromMongo(game.toObject());

  const { reveals, lineChoice, didPlayOptimally, score } =
    cactpot.takeTurn(turn);
  game.reveals = reveals;
  game.didPlayOptimally = didPlayOptimally;
  if (lineChoice) game.lineChoice = lineChoice;
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
  const agg = Round.aggregate()
    .match({ channelId, leaderboardEnabled: true })
    .lookup({
      from: Game.collection.name,
      localField: "_id",
      foreignField: "round",
      as: "games",
    })
    .match({ "games.0": { $exists: true } })
    .addFields({
      scores: {
        $sortArray: {
          input: { $setUnion: ["$games.score"] },
          sortBy: -1,
        },
      },
      // the best/worst score a player achieved
      bestPlayerScore: { $max: "$games.score" },
      worstPlayerScore: { $min: "$games.score" },
      // the number of players who achieved that score
      bestPlayerScoreCount: {
        $size: {
          $filter: {
            input: "$games",
            as: "game",
            cond: { $eq: ["$$game.score", { $max: "$games.score" }] },
          },
        },
      },
      worstPlayerScoreCount: {
        $size: {
          $filter: {
            input: "$games",
            as: "game",
            cond: { $eq: ["$$game.score", { $min: "$games.score" }] },
          },
        },
      },
    })
    .project({
      _id: 1,
      scores: 1,
      bestScore: 1,
      bestPlayerScore: 1,
      bestPlayerScoreCount: 1,
      worstPlayerScore: 1,
      worstPlayerScoreCount: 1,
      cactpotPossible: 1,
    });

  return agg.pipeline() as PipelineStage.Lookup["$lookup"]["pipeline"];
}

export async function getLeaderboard(channelId: string): Promise<
  {
    userId: string;
    countGames: number;
    cactpots: number;
    cactpotsMissed: number;
    bestsAchieved: number;
    totalScore: number;
    soloWins: number;
    soloLosses: number;
    didPlayOptimallyCount: number;
    zags: number;
    firstPlaceMedals: number;
    secondPlaceMedals: number;
    thirdPlaceMedals: number;
    dingusAwards: number;
  }[]
> {
  const agg = Game.aggregate()
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
      totalScore: {
        $sum: "$score",
      },
      bestsAchieved: {
        $sum: {
          $toInt: {
            $eq: ["$score", "$round.bestScore"],
          },
        },
      },
      soloWins: {
        $sum: {
          $toInt: {
            $and: [
              { $eq: ["$score", "$round.bestPlayerScore"] },
              { $eq: ["$round.bestPlayerScoreCount", 1] },
            ],
          },
        },
      },
      soloLosses: {
        $sum: {
          $toInt: {
            $and: [
              { $eq: ["$score", "$round.worstPlayerScore"] },
              { $eq: ["$round.worstPlayerScoreCount", 1] },
            ],
          },
        },
      },
      didPlayOptimallyCount: {
        $sum: {
          $toInt: "$didPlayOptimally",
        },
      },
      zags: {
        $sum: {
          $toInt: {
            $and: [
              { $eq: ["$score", "$round.bestPlayerScore"] },
              { $eq: ["$round.bestPlayerScoreCount", 1] },
              { $not: "$didPlayOptimally" },
            ],
          },
        },
      },
      firstPlaceMedals: {
        $sum: {
          $toInt: {
            $eq: ["$score", { $arrayElemAt: ["$round.scores", 0] }],
          },
        },
      },
      secondPlaceMedals: {
        $sum: {
          $toInt: {
            $eq: ["$score", { $arrayElemAt: ["$round.scores", 1] }],
          },
        },
      },
      thirdPlaceMedals: {
        $sum: {
          $toInt: {
            $eq: ["$score", { $arrayElemAt: ["$round.scores", 2] }],
          },
        },
      },
      dingusAwards: {
        $sum: {
          $toInt: {
            $eq: ["$score", { $arrayElemAt: ["$round.scores", 3] }],
          },
        },
      },
    })
    .addFields({
      userId: "$_id",
    })
    .sort({
      wins: -1,
      totalScore: -1,
    });

  try {
    return agg.exec();
  } catch {
    throw new Errors.NotFound();
  }
}

export async function getLastUnfinishedGame(
  userId: string,
  channelId: string
): Promise<Cactpot | undefined> {
  const results = await Game.aggregate()
    .lookup({
      from: Round.collection.name,
      localField: "round",
      foreignField: "_id",
      as: "round",
    })
    .unwind("round")
    .match({
      userId,
      "round.channelId": channelId,
      score: { $exists: false },
    })
    .sort({ _id: -1 })
    .limit(1)
    .exec();

  return results.length ? Cactpot.fromMongo(results[0]) : undefined;
}

export async function findCheaters(channelId: string): Promise<
  {
    userId: string;
    countGames: number;
    numOptimalChoices: number;
  }[]
> {
  const agg = Game.aggregate()
    .match({
      reveals: { $size: 3 },
    })
    .lookup({
      from: Round.collection.name,
      localField: "round",
      foreignField: "_id",
      as: "round",
    })
    .unwind("round")
    .match({
      "round.channelId": channelId,
      "round.leaderboardEnabled": true,
    });
  const games = await agg.exec();
  const gamesWithOpti = games.map((game) => {
    const cactpot = Cactpot.fromMongo(game);
    const { userId, didPlayOptimally } = cactpot.getSummary();
    return {
      userId,
      didPlayOptimally,
    };
  });
  const usersWithCount = gamesWithOpti.reduce<Record<string, number[]>>(
    (userMap, { userId, didPlayOptimally }) => {
      if (!userMap[userId]) userMap[userId] = [];
      userMap[userId].push(Number(didPlayOptimally));
      return userMap;
    },
    {}
  );
  return Object.entries(usersWithCount).map(([userId, arr]) => ({
    userId,
    countGames: arr.length,
    numOptimalChoices: arr.reduce((a, b) => a + b, 0),
  }));
}

Game.syncIndexes();

// migration
export async function addDidPlayOptimally() {
  const games = await Game.find({}).populate("round");
  games.forEach((game) => {
    const cactpot = Cactpot.fromMongo(game.toObject());
    const { didPlayOptimally } = cactpot.getSummary();
    game.didPlayOptimally = didPlayOptimally;
    console.log(
      `start: game id ${game.id} did play optimally ${didPlayOptimally}`
    );
    game
      .save()
      .then(() => {
        console.log(
          `success: game id ${game.id} did play optimally ${didPlayOptimally}`
        );
      })
      .catch(() =>
        console.log(
          `fail: game id ${game.id} did play optimally ${didPlayOptimally}`
        )
      );
  });
}
