const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = require('./users')();

function message(nameS, textS, idS, linkS){
	return ({name: nameS, text: textS, id: idS, link: linkS})
};

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
	console.log('IO connection');
	
	socket.on('join', (user, callback) => {
		if (!user.name || !user.room) {
			return callback('Enter error');
		}
		
		socket.join(user.room);
		
		users.remove(socket.id);
		users.add(socket.id, user.name, user.room);
		
		callback({userId: socket.id})
		
		io.to(user.room).emit('users:update', users.getByRoom(user.room));
		
		socket.emit('message:new', message('Admin', `Welcome ${user.name}`));
		socket.broadcast.to(user.room).emit('message:new', message('Admin', `${user.name} join in chat`));
	});
	
	socket.on('message:create', (data, callback) => {
		
		if (!data.text) {
			callback(`Message can't be empty`);
		} else {
			const user = users.get(socket.id);
			if (user) {
				io.to(user.room).emit('message:new', message(data.name, data.text, data.id));
			}
			callback();
		}
	});
	
	socket.on('message:invite', (data, callback) => {
		const link = 'http://localhost:3000/chat.html?name='+ 'ZAG' + '&room=' + data.room
		socket.broadcast.emit('message:joinChat', message('Admin', `${data.name} invite you in room ${data.room}`, socket.id, link));
		socket.emit('message:new', message('Admin', `You invite all users in your room chat`));
	});
	
	socket.on('disconnect', () => {
		const user = users.remove(socket.id);
		if (user) {
			io.to(user.room).emit('message:new', message('Admin', `${user.name} disconnect`));
			io.to(user.room).emit('users:update', users.getByRoom(user.room));
		}
	});
});

server.listen(3000, () => {
	console.log('Server has been started...');
})