import path from "path";

const xlsx = require('xlsx');
const fs = require('fs');
const request = require("request");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ready output folder
let a = fs.readFileSync("./paths.json");
let paths = JSON.parse(a.toString());

console.log(process.cwd());

let inputPath: string = paths["defaultCatDataPath"];
let localizationPath: string = paths["defaultCatLocPath"];
let askForPath = false;
try
{
	if (!fs.lstatSync(inputPath).isFile() || !fs.lstatSync(localizationPath).isFile())
	{
		console.log("File not found at paths. Now asking for paths:");
		askForPath = true;
	};
}
catch
{
	console.log("File not found at paths. Now asking for paths:");
	askForPath = true;
}

if (askForPath)
{
	rl.question("Input file path: ", function (link: string) {
		inputPath = link;

		rl.question("Input localization path: ", function (link: string) {
			localizationPath = link;
			rl.close();
		});
	});

	rl.on("close", () =>
	{
		perform();
	});
}
else
{
	perform();
}

function perform()
{
	try {
		if (!fs.lstatSync(inputPath).isFile() || !fs.lstatSync(localizationPath).isFile()) {
			console.log("Failed. Terminated. Check if \".xlsx\" is missing.");
			return;
		};
	}
	catch (e)
	{
		console.log(e);
		console.log("Failed. Terminated. Check if \".xlsx\" is missing.");
		return;
	}

	// Read data
	// Facilities
	let allFacilitiesData = [];
	let workbook = xlsx.readFile(inputPath);

	let facilitySheet = workbook.Sheets["Facilities"];
	let col = "A";
	let row = 3;

	while (facilitySheet[col + row.toString()] !== undefined) {
		let cell = col + row.toString();
		if (facilitySheet[cell] !== undefined && facilitySheet[cell].t === 'n') {
			let data =
			{
				id: facilitySheet["B" + row].v,
				nameString: facilitySheet["C" + row].v,
				description: facilitySheet["D" + row].v,
				type: facilitySheet["E" + row].v,
				blockRequired: facilitySheet["F" + row].v,
				prices: [
					{ nameString: "coin", amount: facilitySheet["G" + row] === undefined || facilitySheet["G" + row].v === "Free" ? 0 : facilitySheet["G" + row].v },
					{ nameString: "coin", amount: facilitySheet["H" + row] === undefined || facilitySheet["H" + row].v === "Free" ? 0 : facilitySheet["H" + row].v },
					{ nameString: "coin", amount: facilitySheet["I" + row] === undefined || facilitySheet["I" + row].v === "Free" ? 0 : facilitySheet["I" + row].v },
					{ nameString: "coin", amount: facilitySheet["J" + row] === undefined || facilitySheet["J" + row].v === "Free" ? 0 : facilitySheet["J" + row].v },
				],
				playTime: facilitySheet["K" + row].v,
				payout: [
					{ nameString: "coin", amount: facilitySheet["L" + row] === undefined ? 0 : facilitySheet["L" + row].v },
					{ nameString: "coin", amount: facilitySheet["M" + row] === undefined ? 0 : facilitySheet["M" + row].v },
					{ nameString: "coin", amount: facilitySheet["N" + row] === undefined ? 0 : facilitySheet["N" + row].v },
					{ nameString: "coin", amount: facilitySheet["O" + row] === undefined ? 0 : facilitySheet["O" + row].v },
				],
				rechargeTime: 1
			};

			allFacilitiesData.push(data);
		}

		++row;
	}

	// Cats
	let catSheet = workbook.Sheets["Cats"];
	let allCatData = [];

	col = "A";
	row = 3;

	while (catSheet[col + row.toString()] !== undefined) {
		let data = {
			id: catSheet["B" + row].v,
			nameString: catSheet["C" + row].v,
			description: catSheet["D" + row].v,
			moveSpeed: catSheet["E" + row].v,
			moveDelayTime: catSheet["F" + row].v,
		}
		allCatData.push(data);

		++row;
	}

	// Puzzle levels
	let puzzleSheet = workbook.Sheets["PuzzleLevels"]
	let allPuzzleData = [];

	let col1 = "A";
	let col2 = "L";
	let col3 = "W";
	row = 3;

	while (catSheet[col1 + row.toString()] !== undefined
		|| catSheet[col2 + row.toString()] !== undefined
		|| catSheet[col3 + row.toString()] !== undefined) {
		let blocks1: number[][] = [];
		let blocks2: number[][] = [];
		let blocks3: number[][] = [];
		for (let i = 0; i < 8; ++i) {
			let rowData1 =
				[
					puzzleSheet["D" + (row + i)] === undefined ? 0 : puzzleSheet["D" + (row + i)].v,
					puzzleSheet["E" + (row + i)] === undefined ? 0 : puzzleSheet["E" + (row + i)].v,
					puzzleSheet["F" + (row + i)] === undefined ? 0 : puzzleSheet["F" + (row + i)].v,
					puzzleSheet["G" + (row + i)] === undefined ? 0 : puzzleSheet["G" + (row + i)].v,
					puzzleSheet["H" + (row + i)] === undefined ? 0 : puzzleSheet["H" + (row + i)].v,
					puzzleSheet["I" + (row + i)] === undefined ? 0 : puzzleSheet["I" + (row + i)].v,
					puzzleSheet["J" + (row + i)] === undefined ? 0 : puzzleSheet["J" + (row + i)].v,
					puzzleSheet["K" + (row + i)] === undefined ? 0 : puzzleSheet["K" + (row + i)].v,
				];
			let rowData2 =
				[
					puzzleSheet["O" + (row + i)] === undefined ? 0 : puzzleSheet["O" + (row + i)].v,
					puzzleSheet["P" + (row + i)] === undefined ? 0 : puzzleSheet["P" + (row + i)].v,
					puzzleSheet["Q" + (row + i)] === undefined ? 0 : puzzleSheet["Q" + (row + i)].v,
					puzzleSheet["R" + (row + i)] === undefined ? 0 : puzzleSheet["R" + (row + i)].v,
					puzzleSheet["S" + (row + i)] === undefined ? 0 : puzzleSheet["S" + (row + i)].v,
					puzzleSheet["T" + (row + i)] === undefined ? 0 : puzzleSheet["T" + (row + i)].v,
					puzzleSheet["U" + (row + i)] === undefined ? 0 : puzzleSheet["U" + (row + i)].v,
					puzzleSheet["V" + (row + i)] === undefined ? 0 : puzzleSheet["V" + (row + i)].v,
				];
			let rowData3 =
				[
					puzzleSheet["Z" + (row + i)] === undefined ? 0 : puzzleSheet["Z" + (row + i)].v,
					puzzleSheet["AA" + (row + i)] === undefined ? 0 : puzzleSheet["AA" + (row + i)].v,
					puzzleSheet["AB" + (row + i)] === undefined ? 0 : puzzleSheet["AB" + (row + i)].v,
					puzzleSheet["AC" + (row + i)] === undefined ? 0 : puzzleSheet["AC" + (row + i)].v,
					puzzleSheet["AD" + (row + i)] === undefined ? 0 : puzzleSheet["AD" + (row + i)].v,
					puzzleSheet["AE" + (row + i)] === undefined ? 0 : puzzleSheet["AE" + (row + i)].v,
					puzzleSheet["AF" + (row + i)] === undefined ? 0 : puzzleSheet["AF" + (row + i)].v,
					puzzleSheet["AG" + (row + i)] === undefined ? 0 : puzzleSheet["AG" + (row + i)].v,
				];
			blocks1.push(rowData1.map(v => v === "x" ? 9 : v));
			blocks2.push(rowData2.map(v => v === "x" ? 9 : v));
			blocks3.push(rowData3.map(v => v === "x" ? 9 : v));
		}

		let data1 = {
			id: puzzleSheet["B" + row].v,
			levelNumber: puzzleSheet["A" + row].v,
			name: puzzleSheet["C" + row].v,
			blockData: blocks1
		}

		let data2 = {
			id: puzzleSheet["M" + row].v,
			levelNumber: puzzleSheet["L" + row].v,
			name: puzzleSheet["N" + row].v,
			blockData: blocks2
		}

		let data3 = {
			id: puzzleSheet["X" + row].v,
			levelNumber: puzzleSheet["W" + row].v,
			name: puzzleSheet["Y" + row].v,
			blockData: blocks3
		}

		allPuzzleData.push(data1, data2, data3);

		row += 8;
	}
	// Sort 
	allPuzzleData.sort((a, b) => a.levelNumber - b.levelNumber);

	// Puzzle weight
	let puzzlePropertiesSheet = workbook.Sheets["PuzzleProperties"];
	let puzzleProperties = {
		fishChance: 0 as number,
		weights: [] as (readonly [string, number])[],
	}

	puzzleProperties.fishChance = puzzlePropertiesSheet["D3"].v as number;

	col = "A";
	row = 3;

	while (puzzlePropertiesSheet[col + row] !== undefined) {
		let id = puzzlePropertiesSheet["A" + row].v as string;
		let weight = puzzlePropertiesSheet["B" + row].v as number;
		puzzleProperties.weights.push([id, weight]);
		++row;
	}

	puzzleProperties.weights.sort((a, b) => {
		if (a[0] < b[0]) return -1;
		else if (a[0] > b[0]) return 1;
		else return 0;
	});

	// Missions
	let missionSheet = workbook.Sheets["Mission"];
	let allMissionData = [];

	col = "A";
	row = 3;
	let currencyRegex = new RegExp("(\\d+) (\\w+)", "g");

	while (missionSheet[col + row] !== undefined)
	{
		console.log(row);
		let tokens = (missionSheet["H" + row].v as string).trim().split(',').map(x => x.trim());
		let payout = tokens.map(x =>
		{
			var result = currencyRegex.exec(x);
			currencyRegex.lastIndex = 0;
			if (result !== null)
			{
				
				return {
					nameString: result[2].trim(),
					amount: parseInt(result[1])
				}
			}
			else
			{
				return null;
			}
		}).filter(x => x != null && x != undefined);

		let data = {
			id: missionSheet["B" + row].v as string,
			nameString: missionSheet["F" + row].v as string,
			type: missionSheet["C" + row].v as string,
			imageId: missionSheet["E" + row].v as string,
			prerequisite: missionSheet["D" + row] !== undefined ? missionSheet["D" + row].v as string : "",
			eventsToCatch: (missionSheet["I" + row].v as string).split(','),
			eventParams: (missionSheet["J" + row].v as string).split(','),
			totalProgress: missionSheet["G" + row].v,
			goAction: missionSheet["K" + row] !== undefined ? missionSheet["K" + row].v as string : "",
			payout: payout,
		}

		allMissionData.push(data);

		++row;
	}

	// Localization
	let locWorkbook = xlsx.readFile(localizationPath);
	let lanMap = new Map<string, Map<string, string>>();

	for (let name of locWorkbook.SheetNames)
	{
		let sheetName = name as string;
		if (sheetName.indexOf("IGNORE") >= 0) {
			continue;
		}

		let cols = "BCDEFGHIJKLMNOPQRSTUVWXYZ";
		let locSheet = locWorkbook.Sheets[sheetName];
		let r = 2;
		while (locSheet["A" + r] !== undefined)
		{
			let key = locSheet["A" + r] === undefined ? "" : locSheet["A" + r].v as string;
			key = key.trim();
			for (let col of cols)
			{
				if (locSheet[col + r] !== undefined && locSheet[col + "1"] !== undefined)
				{
					let value = locSheet[col + r].v;
					let lan = locSheet[col + "1"].v;
					if (!lanMap.has(lan))
					{
						lanMap.set(lan, new Map<string, string>());
					}

					lanMap.get(lan)?.set(key, value);
				}
			}
			++r;
		}
	}

	for (let dataPath of [paths["catPath"], paths["facilityPath"], paths["localizationPath"]]) {
		let files = fs.readdirSync(dataPath);

		for (let file of files) {
			let filePath = path.join(dataPath, file);
			if (path.extname(filePath) !== ".json") {
				continue;
			}

			// Delete
			fs.unlinkSync(filePath);
		}
	}

	// Output to folders
	for (let data of allFacilitiesData) {
		let content = JSON.stringify(data, null, "\t");
		let name = data.id + ".json";
		let savePath = path.join(paths["facilityPath"], name);
		fs.createWriteStream(savePath);
		fs.writeFile(savePath, content, "utf-8", (err: Error) => {
			if (err) {
				console.log(err);
			}
			else {
				console.log("Wrote file " + savePath);
			}
		});
	}

	for (let data of allCatData) {
		let content = JSON.stringify(data, null, "\t");
		let name = data.id + ".json";
		let savePath = path.join(paths["catPath"], name);
		fs.createWriteStream(savePath);
		fs.writeFile(savePath, content, "utf-8", (err: Error) => {
			if (err) {
				console.log(err);
			}
			else {
				console.log("Wrote file " + savePath);
			}
		});
	}

	// Puzzle levels
	let content1 = JSON.stringify(allPuzzleData, null);
	let name1 = "puzzle_levels.json";
	let savePath1 = path.join(paths["puzzleLevelPath"], name1);
	fs.createWriteStream(savePath1);
	fs.writeFile(savePath1, content1, "utf-8", (err: Error) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log("Wrote file " + savePath1);
		}
	});

	// Puzzle properties
	let content2 = JSON.stringify(puzzleProperties, null, "\t");
	let name2 = "puzzle_properties.json";
	let savePath2 = path.join(paths["puzzlePropertiesPath"], name2);
	fs.createWriteStream(savePath2);
	fs.writeFile(savePath2, content2, "utf-8", (err: Error) => {
		if (err) {
			console.log(err);
		}
		else {
			console.log("Wrote file " + savePath2);
		}
	});

	// Missions
	for (let data of allMissionData)
	{
		let content = JSON.stringify(data, null, "\t");
		let name = data.id + ".json";
		let savePath = path.join(paths["missionsPath"], name);
		fs.createWriteStream(savePath);
		fs.writeFile(savePath, content, "utf-8", (err: Error) => {
			if (err) {
				console.log(err);
			}
			else {
				console.log("Wrote file " + savePath);
			}
		});
		}

	// Localization
	for (let [key, map] of lanMap)
	{
		let content = JSON.stringify(Object.fromEntries(map), null, "\t");
		let name = key + ".json";
		let savePath = path.join(paths["localizationPath"], name);
		fs.createWriteStream(savePath);
		fs.writeFile(savePath, content, "utf-8", (err: Error) => {
			if (err) {
				console.log(err);
			}
			else {
				console.log("Wrote file " + savePath);
			}
		});
	}
}