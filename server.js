const fs = require('fs');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*'
    }
});

// Array to store room information
const rooms = [];

io.on('connection', (socket) => {

    const logData = { socketId: socket.id, event: 'user_connected', timestamp: new Date() };
    const logString = JSON.stringify(logData, null, 2); // Indent with 2 spaces for readability
    fs.appendFile('log.txt', ">>>>>> CONNECTED >>>>>\n", () => { });
    fs.appendFile('log.txt', logString + '\n', (err) => { });

    socket.on('message', (dataString) => {
        fs.appendFile('log.txt', ">>>>>> DATA >>>>>\n", (err) => { });
        fs.appendFile('log.txt', dataString + '\n', (err) => { });

        let data = JSON.parse(dataString);
        let index;

        switch (data.cmd) {
            case "CREATE_ROOM":
                // Add room information to the rooms array
                // Name : ROOM_Name : socket.id is the room name for the test
                // Player1 : The guy who create the room :: will add the name of the player but now socket.id for test
                // Player2 : The guy who would like to join.
                // Map : The map to be used on the MULTI-players
                // Status : 0 : No play, 1 : Someone Joined, 2 : Playing now...

                rooms.push({ name: socket.id, player1: socket.id, player2: undefined, status: 0, map: data.map });

                socket.emit('message', { cmd: "ROOM_CREATED", name: socket.id, msg: data.name + " is Created!" });
                break;
            case "CLOSE_ROOM":
                // Find the room index in the array
                index = rooms.findIndex(room => room.name === data.name);
                if (index !== -1) {
                    rooms.splice(index, 1);
                }

                socket.emit('message', { cmd: "ROOM_CLOSED", msg: data.name + " is Closed!" });
                break;

            case "GET_SERVERS":
                socket.emit('ROOM', { cmd: "GOT_SERVERS", servers: rooms });
                break;

            // Temporary code to start, you have to modify according to the roomName
            case "START_PLAY_GAME":
                if (data.role == 'server') {
                    index = rooms.findIndex(room => room.name === socket.id);
                    if (index !== -1) {
                        console.log(data);
                        const otherPlayer = io.sockets.sockets.get(rooms[index].player2);
                        console.log("other : ", otherPlayer);
                        if (otherPlayer) {
                            otherPlayer.emit("START_PLAY_GAME_APPROVED", {msg : "Start Game ! OK !"});
                        }
                        socket.emit("START_PLAY_GAME_APPROVED", {msg : "Start Game ! OK !"});
                    }
                } else if (data.role == 'client') {
                    index = rooms.findIndex(room => room.player2 === socket.id);
                    if (index !== -1) {
                        console.log(data);

                        const otherPlayer = io.sockets.sockets.get(rooms[index].player1);
                        console.log("other : ", otherPlayer);
                        if (otherPlayer) {
                            otherPlayer.emit("START_PLAY_GAME_APPROVED", {msg : "Start Game ! OK !"});
                        }
                        socket.emit("START_PLAY_GAME_APPROVED", {msg : "Start Game ! OK !"});                    }
                }

                break;

            case "JOIN_GAME":
                index = rooms.findIndex(room => room.name === data.name);

                if (index != -1) {
                    // Add the second player to the new joiner
                    rooms[index].player2 = socket.id;

                    const player1Socket = io.sockets.sockets.get(rooms[index].player1);
                    if (player1Socket) {
                        player1Socket.emit("ROOM", {
                            cmd: 'GOT_JOINED_TO_SERVER',
                            name: rooms[index].name,
                            msg: "player1 : " + rooms[index].player1 + " player2 : " + rooms[index].player2,
                            globalMap: rooms[index].map
                        });
                    }

                    socket.emit("ROOM", {
                        cmd: 'GOT_JOINED_TO_CLIENT', msg: "player1 : " + rooms[index].player1 + " player2 : " + rooms[index].player2,
                        globalMap: rooms[index].map
                    });
                }

                break;
            default:
                // Handle any other commands here
                console.log("Unknown command: " + data.cmd);
                break;
        }

        fs.appendFile('log.txt', "\n>>>>>> whole ROOMS >>>>>\n", (err) => { });
        fs.appendFile('log.txt', JSON.stringify(rooms) + '\n', (err) => { });
    });

    socket.on('disconnect', () => {
        const index = rooms.findIndex(room => room.name === socket.id);
        if (index !== -1) {
            rooms.splice(index, 1);
            console.log(rooms);
        }
    });


});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
