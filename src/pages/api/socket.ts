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
            console.log('✅ Connected:', socket.id);

            socket.on('join-room', (roomId: string) => {
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
                });
            });

            socket.on('move', ({ roomId, move }: { roomId: string; move: { x: number; y: number } }) => {
                if (rooms[roomId] && rooms[roomId].players[socket.id]) {
                    rooms[roomId].players[socket.id] = move;
                    socket.to(roomId).emit('player-moved', { id: socket.id, pos: move });
                }
            });

            socket.on('chat-message', ({ roomId, playerId, text }: { roomId: string, playerId: string; text: string }) => {
                console.log('📨 Server received chat-message:', { roomId, playerId, text });
                if (rooms[roomId]) {
                    io.to(roomId).emit('chats-update', { playerId, text });
                    console.log('📤 Emitted chats-update to room:', roomId);
                } else {
                    console.log('❌ Room not found:', roomId);
                }
            });

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
