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
                console.log(JSON.stringify({ cmd: "ROOM_CREATED", msg: socket.id + " is Created!" }));

                // Add room information to the rooms array
                // Name : ROOM_Name : socket.id is the room name for the test
                // Player1 : The guy who create the room :: will add the name of the player but now socket.id for test
                // Player2 : The guy who would like to join.
                // Map : The map to be used on the MULTI-players
                rooms.push({ name: socket.id, player1: socket.id, player2: undefined, map: data.map });
                console.log("ADDED to the rooms list !!");
                console.log(rooms);

                socket.emit('message', { cmd: "ROOM_CREATED", name: socket.id, msg: data.name + " is Created!" });
                break;
            case "CLOSE_ROOM":
                // Find the room index in the array
                index = rooms.findIndex(room => room.name === data.name);
                if (index !== -1) {
                    // Remove the room from the array
                    rooms.splice(index, 1);
                    console.log("Removed to the rooms list !!");
                    console.log(rooms);
                }

                socket.emit('message', { cmd: "ROOM_CLOSED", msg: data.name + " is Closed!" });
                break;

            case "GET_SERVERS":

                console.log("####################");
                console.log("I will return servers :", rooms);

                socket.emit('ROOM', { cmd: "GOT_SERVERS", servers: rooms });

                break;

            case "JOIN_GAME":
                index = rooms.findIndex(room => room.name === data.name);

                if (index != -1) {
                    // Add the second player to the new joiner
                    rooms[index].player2 = socket.id;

                    console.log("Second player added !!");
                    console.log(rooms);

                    const player1Socket = io.sockets.sockets.get(rooms[index].player1);
                    console.log("Who is the player 1 ? ", player1Socket.id);
                    if (player1Socket) {

                        console.log("Send msg to the player1");
                        player1Socket.emit("ROOM", {
                            cmd : 'GOT_JOINED',
                            name : rooms[index].name,
                            msg: "player1 : " + rooms[index].player1 + " player2 : " + rooms[index].player2,
                            globalMap: rooms[index].map
                        });
                    }

                    socket.emit("ROOM", {
                        cmd: 'GOT_JOINED', msg: "player1 : " + rooms[index].player1 + " player2 : " + rooms[index].player2,
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
        // fs.appendFile('log.txt', "ROOM COUNT : ", rooms.length, (err) => { });
        fs.appendFile('log.txt', JSON.stringify(rooms) + '\n', (err) => { });
    });

    socket.on('disconnect', () => {
        const index = rooms.findIndex(room => room.name === socket.id);
        if (index !== -1) {
            // Remove the room from the array
            rooms.splice(index, 1);
            console.log("Removed to the rooms list !!");
            console.log(rooms);
        }
    });


});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

