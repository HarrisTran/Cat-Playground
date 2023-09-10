import { _decorator, Camera, Canvas, Component, Node, macro, find, director, Game, CCFloat } from 'cc';
import { BASE_URL_DEV, BASE_URL_PRO } from './GameConfig';
const { ccclass, property } = _decorator;

export class LoginParams
{
    deviceId: string;
    platform: string;
    os: string;
    playerName: string;
    game: any;
}

@ccclass
export default class Http
{
	static post(url: string, params: object, onFinished: (err: any, json: any) => void, isSendNormalParams = false)
	{
		try {
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function ()
			{
				if (xhr.readyState === 4)
				{
					console.log("POST result: ", xhr.status, xhr.statusText);
					if (xhr.status >= 200 && xhr.status <= 300)
					{
						var data = null;
						var e = null;
						try
						{
							data = JSON.parse(xhr.responseText);
						}
						catch (ex)
						{
							e = ex;
						}
						onFinished(e, data);
					}
					else
					{
						onFinished(xhr.status, null);
					}
				}
			};

			console.log("POST: ", `${BASE_URL_DEV}${url} `, params);
			xhr.open("POST", `${BASE_URL_DEV}${url}`, true);
			xhr.setRequestHeader("Content-type", "application/json");
			xhr.send(JSON.stringify(params));
		}
		catch (error)
		{
			console.log('error', error);
		}
	}

	static get(url: string, params: object, onFinished: (err: any, json: any) => void)
	{
		try
		{
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function ()
			{
				if (xhr.readyState === 4)
				{
					console.log("GET result: ", xhr.status, xhr.statusText);
					if (xhr.status == 200)
					{
						var data = null;
						var e = null;
						try {
							data = JSON.parse(xhr.responseText);
						} catch (ex)
						{
							e = ex;
						}
						onFinished(e, data);
					}
					else
					{
						onFinished(xhr.status, null);
					}
				}
			};

			// Parse params
			var parsedParams = "?";
			if (params !== null) {
				var count = 0;
				var paramsLength = Object.keys(params).length;
				for (var key in params) {
					if (params.hasOwnProperty(key)) {
						parsedParams += key + "=" + params[key];
						if (count < paramsLength - 1) {
							parsedParams += "&";
						}
					}
					count++;
				}
			}
			var link = url + parsedParams;
			console.log("GET: ", `${BASE_URL_DEV}${link}`);
			xhr.open("GET", `${BASE_URL_DEV}${link}`, true);
			xhr.send();
		}
		catch (error)
		{
			console.log('error', error);
		}
	}
}