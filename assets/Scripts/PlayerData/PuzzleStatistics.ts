import { TetrominoData } from "../Puzzle/PuzzleComponents/TetrominoPiece";
import { formatMiliseconds, formatHoursMinsSeconds } from "../Utilities/NumberUtilities";

export class PuzzleStatistics
{
	public onGoingSession: PuzzleSession;
	public completedSessions: CompletedSessionData[];

	public constructor()
	{
		this.onGoingSession = null;
		this.completedSessions = [];
	}

	public static toCSVString(stat: PuzzleStatistics): string
	{
		if (stat.completedSessions.length == 0) return " ";

		let result = "";
		
		// Header
		result +=
			"Time played," +
			"Round," +
			"Score," +
			"High Score," +
			"Fish Caught," +
			"Fish Appeared," +
			"% Fish appear (by rounds)," +
			"Peak combo,";

		let colMap = new Map<string, number>();
		let s0 = stat.completedSessions[0].session;

		let i = 0;
		for (let piece of s0.pieceAppearanceCounts)
		{
			let id = piece.pieceId;
			colMap.set(id, i);
			++i;
			result += id + ',';
		}

		result += "\n";

		// Lines
		for (let session of stat.completedSessions)
		{
			let line = "";
			let s = session.session;
			line +=
				formatHoursMinsSeconds(s.playTime) + "," +
				s.round + "," +
				s.score + "," +
				s.highScore + "," +
				s.fishCaught + "," +
				s.fishAppeared + "," +
				s.fishAppeared / s.round + "," +
				s.peakCombo + ",";

			let ordered = new Array<number>(colMap.size);
			for (let piece of s.pieceAppearanceCounts)
			{
				let id = piece.pieceId;
				let count = piece.count;
				let i = colMap.get(id);
				ordered[i] = count;
			}

			for (let num of ordered)
			{
				line += num + ',';
			}

			result += line + "\n";
		}

		return result;
	}
}

// Reuse this to save game progress
export class PuzzleSession
{
	public sessionCompleted: boolean;
	public playTime: number;
	public puzzleGrid: number[];
	public queuePieces: SavedPieceData[];
	public score: number;
	public oldHighScore: number;
	public highScore: number;
	public combo: number;
	public peakCombo: number;
	public round: number;
	public fishCaught: number;
	public fishAppeared: number;
	public pieceAppearanceCounts: PieceAppearanceCount[];
}

export class PieceAppearanceCount
{
	public pieceId: string;
	public count: number;

	public constructor(id: string, count: number)
	{
		this.pieceId = id;
		this.count = count;
	}
}

export class CompletedSessionData
{
	public endTime: number;
	public session: PuzzleSession;

	public constructor(endTime: number, session: PuzzleSession)
	{
		this.endTime = endTime;
		this.session = session;
	}
}

export class SavedPieceData
{
	public id: string;
	public selected: number;
	public active: boolean

	public constructor(id: string, selected: number, active: boolean)
	{
		this.id = id;
		this.selected = selected;
		this.active = active;
	}
}