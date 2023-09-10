import { BASE_URL_PRO } from "./GameConfig";

export class TestSocket
{
	public Initialize(): void
	{
		let ws = new WebSocket("ws://10.20.10.78:30001");
		ws.onopen = (event) => {
			console.log("Opened, ", event);
		};

		setTimeout(function () {
			try {
				console.log(ws)
				if (ws.readyState === WebSocket.OPEN) {
					ws.addEventListener("connection", (event) => {
						console.log(event)
						ws.send("Hello Server!");
					});
				}
				else {
					console.log("WebSocket instance wasn't ready...");
				}
			} catch (error) {
				console.log('error', error);
			}
			
		}, 3000);
	}
}