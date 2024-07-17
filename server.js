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

        switch (data.cmd) {
            case "CREATE_ROOM":
                console.log(JSON.stringify({ cmd: "ROOM_CREATED", msg: socket.id + " is Created!" }));

                // Add room information to the rooms array
                rooms.push({ name: socket.id, createdBy: socket.id });
                console.log("ADDED to the rooms list !!");
                console.log(rooms);

                socket.emit('message', { cmd: "ROOM_CREATED", name: socket.id, msg: data.name + " is Created!" });
                break;
            case "CLOSE_ROOM":
                // Find the room index in the array
                const index = rooms.findIndex(room => room.name === data.name);
                if (index !== -1) {
                    // Remove the room from the array
                    rooms.splice(index, 1);
                    console.log("Removed to the rooms list !!");
                    console.log(rooms);
                }

                socket.emit('message', { cmd: "ROOM_CLOSED", msg: data.name + " is Closed!" });
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

