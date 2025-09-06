import { Server as IOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';


interface NextApiResponseWithSocket extends NextApiResponse {
    socket: NetSocket & {
        server: HTTPServer & {
            io?: IOServer;
        };
    };
}

export const config = {
    api: {
        bodyParser: false,
    },
};

const rooms: {
    [roomId: string]: {
        players: { [socketId: string]: { state: number } };
    };
} = {};


export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    if (!res.socket.server.io) {
        const io = new IOServer(res.socket.server, {
            path: '/api/rock-paper-scissors',
        });

        res.socket.server.io = io;

        io.on('connection', (socket) => {
            const userId = socket.handshake.auth.userId;
            socket.data.userId = userId;

            socket.on('join-room', (roomId: string) => {
                const userId = socket.data?.userId;
                socket.join(roomId);
                if (!rooms[roomId]) {
                    rooms[roomId] = { players: {} };
                }

                const statePlayer = { state: 0 };
                rooms[roomId].players[socket.id] = statePlayer;

                socket.emit('init-players', rooms[roomId].players);
                socket.to(roomId).emit('player-joined', {
                    id: socket.id,
                    pos: statePlayer,
                    userId
                });
            });

            socket.on('move', ({ roomId, state }: { roomId: string; state: number }) => {
                if (rooms[roomId] && rooms[roomId].players[socket.id]) {
                    rooms[roomId].players[socket.id] = { state };
                    socket.to(roomId).emit('player-moved', { id: socket.id, pos: { state } });
                }
            });

            socket.on('chat-message', ({ roomId, userId, text }: { roomId: string, userId: string; text: string }) => {
                console.log('📨 Server received chat-message:', { roomId, userId, text });
                if (rooms[roomId]) {
                    socket.to(roomId).emit('chats-update', { userId, text });
                    console.log('📤 Emitted chats-update to room:', roomId);
                } else {
                    console.log('❌ Room not found:', roomId);
                }
            });

            socket.on('hit-ball', ({ roomId, x, y }: { roomId: string, x: number, y: number }) => {
                console.log('📨 Server received hit-ball:', { roomId, x, y });
                socket.to(roomId).emit('moving-ball', { x, y })
            })

            socket.on('disconnect', () => {
                for (const roomId in rooms) {
                    if (rooms[roomId].players[socket.id]) {
                        delete rooms[roomId].players[socket.id];
                        socket.to(roomId).emit('player-left', socket.id);
                    }
                }
                console.log('❌ Disconnected:', socket.id);
            });
        });
    } else {
        console.log('♻️ Reusing existing Socket.io server');
    }

    res.end();
}