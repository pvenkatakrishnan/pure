import { bus, Constants } from '../../core-base';
import engine from 'engine.io';
import http from 'http';
import fs from 'fs';
import path from 'path';
import config from '../../../config/modui.json';

const httpServer = http.createServer((req, res) => {
	console.log(req);	// eslint-disable-line
	switch (req.url) {
	case '/':
		fs.createReadStream(path.join(__dirname, '../../../static/dist/modui.html')).pipe(res);
		break;
	default:
		res.writeHead(404);
		res.end('Not found');
	}
});

httpServer.listen(3030);

const sockServer = engine.attach(httpServer, { path: config.server.path });
const sockets = [];

sockServer.on('connection', (socket) => {
	sockets.push(socket);

	socket.on('close', () => {
		const index = sockets.indexOf(socket);
		if (index >= 0) { sockets.splice(index, 1); }
	});
});

bus.on('change', (change) => {
	if (change.entities) {
		for (const id in change.entities) {
			const entity = change.entities[id];
			if (
				entity.type !== Constants.TYPE_THREAD &&
				entity.type !== Constants.TYPE_TEXT ||
				typeof entity.createTime === 'undefined' ||
				typeof entity.updateTime !== 'undefined' &&
				entity.createTime !== entity.updateTime
			) { continue; }
			for (const socket of sockets) {
				socket.send(JSON.stringify(entity));
			}
		}
	}
});
