import { TetrominoData } from "./TetrominoPiece";

export const PredefinedTetrominoPieces = new Array<TetrominoData>(
	{
		id: "tetromino_1_1",
		grid: [
			{
				size: [2, 2] as [number, number],
				data:
					[0, 1,
					1, 0]
			}, {
				size: [2, 2] as [number, number],
				data:
					[1, 0,
					0, 1]
			}
		],
		selected: 0
	},
	{
		id: "tetromino_1_2",
		grid: [{
			size: [3, 3] as [number, number],
			data:
				[0, 0, 1,
				0, 1, 0,
				1, 0, 0]
		}, {
			size: [3, 3] as [number, number],
			data:
				[1, 0, 0,
				0, 1, 0,
				0, 0, 1]
		},],
		selected: 0
	},
	{
		id: "tetromino_2_1",
		grid: [{
			size: [2, 2] as [number, number],
			data:
				[1, 0,
				1, 1]
		}, {
			size: [2, 2] as [number, number],
			data:
				[1, 1,
				0, 1]
		}, {
			size: [2, 2] as [number, number],
			data:
				[0, 1,
				1, 1]
		}, {
			size: [2, 2] as [number, number],
			data:
				[1, 1,
				1, 0]
		}],
		selected: 0
	},
	{
		id: "tetromino_2_2",
		grid: [{
			size: [3, 2] as [number, number],
			data:
				[1, 0, 0,
				1, 1, 1]
		}, {
			size: [2, 3] as [number, number],
			data:
				[1, 1,
				1, 0,
				1, 0]
		}, {
			size: [3, 2] as [number, number],
			data:
				[1, 1, 1,
				0, 0, 1]
		}, {
			size: [2, 3] as [number, number],
			data:
				[0, 1,
				0, 1,
				1, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_2_3",
		grid: [{
			size: [3, 3] as [number, number],
			data:
				[1, 0, 0,
				1, 0, 0,
				1, 1, 1]
		}, {
			size: [3, 3] as [number, number],
			data:
				[1, 1, 1,
				1, 0, 0,
				1, 0, 0]
		}, {
			size: [3, 3] as [number, number],
			data:
				[1, 1, 1,
				0, 0, 1,
				0, 0, 1]
		}, {
			size: [3, 3] as [number, number],
			data:
				[0, 0, 1,
				0, 0, 1,
				1, 1, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_2_4",
		grid: [{
			size: [3, 2] as [number, number],
			data:
				[0, 0, 1,
				1, 1, 1]
		}, {
			size: [2, 3] as [number, number],
			data:
				[1, 0,
				1, 0,
				1, 1]
		}, {
			size: [3, 2] as [number, number],
			data: 
				[1, 1, 1,
				1, 0, 0]
		}, {
			size: [2, 3] as [number, number],
			data:
				[1, 1,
				0, 1,
				0, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_3_1",
		grid: [{
			size: [3, 2] as [number, number],
			data:
				[0, 1, 0,
				1, 1, 1]
		}, {
			size: [2, 3] as [number, number],
			data:
				[1, 0,
				1, 1,
				1, 0]
		}, {
			size: [3, 2] as [number, number],
			data:
				[1, 1, 1,
				0, 1, 0]
		}, {
			size: [2, 3] as [number, number],
			data:
				[0, 1,
				1, 1,
				0, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_3_2",
		grid: [{
			size: [3, 2] as [number, number],
			data:
				[1, 1, 0,
				0, 1, 1]
		}, {
			size: [2, 3] as [number, number],
			data:
				[0, 1,
				1, 1,
				1, 0]
		}],
		selected: 0
	},
	{
		id: "tetromino_3_3",
		grid: [{
			size: [3, 2] as [number, number],
			data:
				[0, 1, 1,
				1, 1, 0]
		}, {
			size: [2, 3] as [number, number],
			data:
				[1, 0,
				1, 1,
				0, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_4_1",
		grid: [{
			size: [2, 2] as [number, number],
			data:
				[1, 1,
				1, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_4_2",
		grid: [{
			size: [3, 2] as [number, number],
			data:
				[1, 1, 1,
				1, 1, 1]
		}, {
			size: [2, 3] as [number, number],
			data:
				[1, 1,
				1, 1,
				1, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_4_3",
		grid: [{
			size: [3, 3] as [number, number],
			data:
				[1, 1, 1,
				1, 1, 1,
				1, 1, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_5_1",
		grid: [{
			size: [1, 1] as [number, number],
			data: [1]
		}],
		selected: 0
	},
	{
		id: "tetromino_5_2",
		grid: [{
			size: [2, 1] as [number, number],
			data: [1, 1]
		}, {
			size: [1, 2] as [number, number],
			data: [1, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_5_3",
		grid: [{
			size: [3, 1] as [number, number],
			data: [1, 1, 1]
		}, {
			size: [1, 3] as [number, number],
			data: [1, 1, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_5_4",
		grid: [{
			size: [4, 1] as [number, number],
			data: [1, 1, 1, 1]
		}, {
			size: [1, 4] as [number, number],
			data: [1, 1, 1, 1]
		}],
		selected: 0
	},
	{
		id: "tetromino_5_5",
		grid: [{
			size: [5, 1] as [number, number],
			data: [1, 1, 1, 1, 1]
		}, {
			size: [1, 5] as [number, number],
			data: [1, 1, 1, 1, 1]
		}],
		selected: 0
	},
);