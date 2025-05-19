// src/pages/api/socket.ts
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
        players: { [socketId: string]: { x: number; y: number } };
    };
} = {};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    if (!res.socket.server.io) {
        console.log('🔌 Starting Socket.io server...');
        const io = new IOServer(res.socket.server, {
            path: '/api/socket',
        });

        res.socket.server.io = io;

        io.on('connection', (socket) => {
            const userId = socket.handshake.auth.userId;
            socket.data.userId = userId;

            console.log('✅ Connected:', socket.id);
            console.log('✅ Connected Player:', userId);

            socket.on('join-room', (roomId: string) => {
                const userId = socket.data?.userId;
                socket.join(roomId);
                if (!rooms[roomId]) {
                    rooms[roomId] = { players: {} };
                }

                const startPos = { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 };
                rooms[roomId].players[socket.id] = startPos;

                socket.emit('init-players', rooms[roomId].players);
                socket.to(roomId).emit('player-joined', {
                    id: socket.id,
                    pos: startPos,
                    userId
                });
            });

            socket.on('move', ({ roomId, move }: { roomId: string; move: { x: number; y: number, userId: string } }) => {
                if (rooms[roomId] && rooms[roomId].players[socket.id]) {
                    rooms[roomId].players[socket.id] = move;
                    socket.to(roomId).emit('player-moved', { id: socket.id, pos: move });
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
