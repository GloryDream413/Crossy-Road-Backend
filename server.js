/********************************************************************** The Road to Valhalla! ************************************************************************
 *                                                                                                                                                                   *
 *  📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌           *
 *  📌                                                                                                                                                  📌         *
 *  📌                                                                                                                                                  📌        *
 *  📌     📌            📌    📌📌         📌           📌       📌         📌📌        📌             📌                      📌📌             📌        *
 *  📌      📌          📌    📌  📌        📌           📌       📌        📌  📌       📌             📌                     📌  📌            📌       *
 *  📌       📌        📌    📌    📌       📌           📌       📌       📌    📌      📌             📌                    📌    📌           📌       *
 *  📌        📌      📌    📌      📌      📌           📌       📌      📌      📌     📌             📌                   📌      📌          📌       *
 *  📌         📌    📌    📌📌📌📌📌     📌            📌📌📌📌📌    📌📌📌📌📌    📌              📌                  📌📌📌📌📌         📌       *
 *  📌          📌  📌    📌          📌    📌           📌       📌    📌         📌   📌              📌                 📌          📌        📌       *
 *  📌           📌📌    📌            📌   📌           📌       📌   📌           📌  📌              📌                📌            📌       📌       *
 *  📌            📌    📌              📌  📌📌📌📌📌 📌        📌  📌            📌 📌📌📌📌📌    📌📌📌📌📌📌   📌              📌      📌       *
 *  📌                                                                                                                                                  📌      *
 *  📌                                                                                                                                                  📌      *
 *  📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌📌      *
 *                                                                                                                                                             *
 *  Project Type  : CrossyGame with NFT management                                                                                                            *
 *   Project ID   : 2024-2                                                                                                                                   *
 *   Client Info  : Private                                                                                                                                 *
 *    Developer   : Rothschild (Nickname)                                                                                                                  *
 *   Source Mode  : 100% Private                                                                                                                          *
 *   Description  : CrossyGame project with NFT as a service.                                                                                            *
 *  Writing Style : P0413-K0408-K1206                                                                                                                   *
 *                                                                                                                                                     *
 ********************************************************************** The Road to Valhalla! *********************************************************
 */
// Sample Libraries
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
// Personal informations
const rooms = [];
// Global variables : MBC-on mobile responsive
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*'
    }
});
io.on('connection', (socket) => {
    socket.on('message', (dataString) => {
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
                console.log("Creating Room with userName : ", data.player1);
                rooms.push({
                    name: socket.id,
                    player1: data.player1, player1_id: socket.id,
                    player2: undefined, player2_id: undefined,
                    status: 0,
                    map: data.map
                });
                socket.emit('message', { cmd: "ROOM_CREATED", name: socket.id });
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
                const ret_servers = [];
                for (let i = 0; i < rooms.length; i++) {
                    let cur = rooms[i];
                    cur.mine = false;
                    if (cur.name == socket.id)
                        cur.mine = true;
                    ret_servers.push(cur);
                }
                socket.emit('ROOM', { cmd: "GOT_SERVERS", servers: ret_servers });
                break;
            case "START_GAME":
                console.log("Request of start_game___________________:", socket.id);
                console.log("data : ", data);
                if (data.role == 'server') {
                    index = rooms.findIndex(room => room.name === socket.id);
                    if (index !== -1) {
                        console.log(data);
                        const otherPlayer = io.sockets.sockets.get(rooms[index].player2_id);
                        // console.log("other : ", otherPlayer);
                        if (otherPlayer) {
                            otherPlayer.emit("ROOM", { cmd: "START_GAME_APPROVED" });
                        }
                        socket.emit("ROOM", { cmd: "START_GAME_APPROVED" });
                    }
                }
                // MBC-if the starting strategy changed
                // else if (data.role == 'client') {
                //     index = rooms.findIndex(room => room.player2 === socket.id);
                //     if (index !== -1) {
                //         console.log(data);
                //         const otherPlayer = io.sockets.sockets.get(rooms[index].player1);
                //         // console.log("other : ", otherPlayer);
                //         if (otherPlayer) {
                //             otherPlayer.emit("START_GAME_APPROVED", { msg: "Start Game ! OK !" });
                //         }
                //         socket.emit("START_GAME_APPROVED", { msg: "Start Game ! OK !" });
                //     }
                // }
                break;
            case "PLAY_GAME":
                console.log("Request of play_game___________________:", socket.id);
                console.log("data : ", data);
                if (data.role == 'server') {
                    index = rooms.findIndex(room => room.name === socket.id);
                    if (index !== -1) {
                        console.log(data);
                        const otherPlayer = io.sockets.sockets.get(rooms[index].player2_id);
                        // console.log("other : ", otherPlayer);
                        if (otherPlayer) {
                            otherPlayer.emit("PLAY_GAME_APPROVED", { role: 'client' });
                            console.log("Sent to the other player: client");
                        }
                        socket.emit("PLAY_GAME_APPROVED", { role: data.role });
                        console.log("Sent to the server:", data.role);
                    }
                }
                // MBC-if the starting strategy changed
                // else if (data.role == 'client') {
                //     index = rooms.findIndex(room => room.player2 === socket.id);
                //     if (index !== -1) {
                //         console.log(data);
                //         const otherPlayer = io.sockets.sockets.get(rooms[index].player1);
                //         // console.log("other : ", otherPlayer);
                //         if (otherPlayer) {
                //             otherPlayer.emit("START_PLAY_GAME_APPROVED", { msg: "Start Game ! OK !" });
                //         }
                //         socket.emit("START_PLAY_GAME_APPROVED", { msg: "Start Game ! OK !" });
                //     }
                // }
                break;
            case "MOVE_PERSON":
                if (data.role == 'server') {
                    index = rooms.findIndex(room => room.name === socket.id);
                    console.log("GOOD!!!", data);
                    console.log({ direction: data.direction, role: data.role, align: data.align });
                    let opRole = data.role == 'server' ? 'client' : 'server';
                    if (index != -1) {
                        socket.emit("MOVE_PERSON_APPROVED", { direction: data.direction, role: data.role, align: data.align });
                        if (rooms[index].player2) {
                            const otherPlayer = io.sockets.sockets.get(rooms[index].player2_id);
                            otherPlayer.emit("MOVE_PERSON_APPROVED", { direction: data.direction, role: opRole, align: data.align });
                            console.log({ direction: data.direction, role: opRole, align: data.align });
                        }
                    }
                } else if (data.role == 'client') {
                    // index of the second player
                    index = rooms.findIndex(room => room.player2_id === socket.id);
                    console.log("GOOD!!!", data);
                    console.log({ direction: data.direction, role: data.role, align: data.align });
                    let opRole = data.role == 'server' ? 'client' : 'server';
                    if (index != -1) {
                        socket.emit("MOVE_PERSON_APPROVED", { direction: data.direction, role: data.role, align: data.align });
                        if (rooms[index].player2) {
                            const otherPlayer = io.sockets.sockets.get(rooms[index].player1_id);
                            otherPlayer.emit("MOVE_PERSON_APPROVED", { direction: data.direction, role: opRole, align: data.align });
                            console.log({ direction: data.direction, role: opRole, align: data.align });
                        }
                    }
                }
                break;
            case "JOIN_GAME":
                index = rooms.findIndex(room => room.name === data.name);
                if (index != -1) {
                    if (rooms[index].status == 0) {
                        // Player2 Joined the Game.
                        rooms[index].status = 1;
                        rooms[index].player2 = data.player2;
                        rooms[index].player2_id = socket.id;
                        const player1Socket = io.sockets.sockets.get(rooms[index].player1_id);
                        if (player1Socket) {
                            player1Socket.emit("ROOM", {
                                cmd: 'GOT_JOINED_TO_SERVER',
                                name: rooms[index].name,
                                globalMap: rooms[index].map,
                                role: 'server',
                                player1: rooms[index].player1,
                                player2: rooms[index].player2,
                            });
                        }
                        socket.emit("ROOM", {
                            state: true,
                            cmd: 'GOT_JOINED_TO_CLIENT',
                            globalMap: rooms[index].map,
                            role: 'client',
                            player1: rooms[index].player1,
                            player2: rooms[index].player2,
                        });
                        rooms[index].status = 1;
                        console.log("Joined:", rooms[index]);
                    }
                }
                else {
                    socket.emit("ROOM", {
                        cmd: 'GOT_JOINED_TO_CLIENT',
                        state: false,
                        reason: 'Other player joined'
                    });
                }
                break;
            case "MOVE_PERSON":
                index = rooms.findIndex(room => room.name === socket.id);
                console.log("Let's move : ", data);
                break;
            case "END_ROOM":
                console.log("End_Room :", data);
                index = rooms.findIndex(room => room.name === socket.id);
                // If server click the end room.
                if (index != -1) {
                    if (rooms[index].player2 != undefined) {
                        const otherPlayer = io.sockets.sockets.get(rooms[index].player2_id);
                        if (otherPlayer) {
                            otherPlayer.emit("END_ROOM", {
                                who: 'server'
                            });
                        }
                    }
                    rooms.splice(index, 1);
                    socket.emit("END_ROOM", {
                        who: 'server'
                    });
                } else {
                    console.log("Client quits the room");
                    // When the client would like to quit from the room
                    index = rooms.findIndex(room => room.player2_id === socket.id);
                    if (index != -1) {
                        rooms[index].player2 = undefined;
                        rooms[index].player2_id = undefined;
                        rooms[index].status = 0;
                        console.log("say server that client quits");
                        const otherPlayer = io.sockets.sockets.get(rooms[index].player1_id);
                        otherPlayer.emit("END_ROOM", {
                            who: 'client'
                        })
                        console.log("say client that server kicked you");
                        socket.emit("END_ROOM", {
                            who: 'server'
                        });
                    }
                }
                break;
            case "END_GAME":
                console.log("End_Game :", data);
                index = rooms.findIndex(room => room.name === socket.id);
                // If server click the end game.
                if (index != -1) {
                    if (rooms[index].player2 != undefined) {
                        const otherPlayer = io.sockets.sockets.get(rooms[index].player2_id);
                        otherPlayer.emit("ROOM", {
                            cmd: 'END_GAME'
                        });
                    }
                    // rooms[index].player2 = undefined;
                    rooms[index].status = 1;
                    // rooms.splice(index, 1);
                    socket.emit("ROOM", {
                        cmd: 'END_GAME'
                    });
                }
                // else {
                //     index = rooms.findIndex(room => room.player2 === socket.id);
                //     // Client end game
                //     if (index != -1) {
                //         if (rooms[index].player1 != undefined) {
                //             const otherPlayer = io.sockets.sockets.get(rooms[index].player1);
                //             otherPlayer.emit("ROOM", {
                //                 cmd: 'END_GAME'
                //             });
                //         }
                //         rooms[index].player2 = undefined;
                //         rooms[index].status = 0;
                //         socket.emit("ROOM", {
                //             cmd: 'END_GAME'
                //         });
                //     }
                // }
                break;
            default:
                // Handle any other commands here
                console.log("Unknown command: " + data.cmd);
                break;
        }
    });
    socket.on('disconnect', () => {
        const index = rooms.findIndex(room => room.player1 === socket.id || room.player2 === socket.id);
        if (index !== -1) {
            rooms.splice(index, 1);
            console.log(rooms);
        }
    });
});
const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
