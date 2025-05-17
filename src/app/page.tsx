'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import io from 'socket.io-client';

const socket = io('', { path: '/api/socket' });

export default function GamePage() {
    const SPEED = 8;
    const CHAR_SIZE = 80;
    const roomId = 'room-001';

    const [players, setPlayers] = useState<{ [id: string]: { x: number; y: number } }>({});
    const [playerId, setPlayerId] = useState<string | null>(null);
    const keysPressed = useRef<{ [key: string]: boolean }>({});

    useEffect(() => {
        socket.emit('join-room', roomId);

        socket.on('connect', () => {
            setPlayerId(socket.id || null);
        });

        socket.on('init-players', (initialPlayers) => {
            setPlayers(initialPlayers);
        });

        socket.on('player-joined', ({ id, pos }) => {
            setPlayers((prev) => ({ ...prev, [id]: pos }));
        });

        socket.on('player-moved', ({ id, pos }) => {
            setPlayers((prev) => ({ ...prev, [id]: pos }));
        });

        socket.on('player-left', (id) => {
            setPlayers((prev) => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        });

        return () => {
            socket.off('connect');
            socket.off('init-players');
            socket.off('player-joined');
            socket.off('player-moved');
            socket.off('player-left');
        };
    }, []);

    useEffect(() => {
        if (!playerId) return;

        let animationFrame: number;
        let lastTime = performance.now();

        const update = (time: number) => {
            const delta = time - lastTime;
            lastTime = time;
            const speed = SPEED * (delta / 30);

            setPlayers((prev) => {
                const myPos = prev[playerId];
                if (!myPos) return prev;

                let { x, y } = myPos;
                const pressed = keysPressed.current;

                if (pressed['a']) x -= speed;
                if (pressed['d']) x += speed;
                if (pressed['w']) y -= speed;
                if (pressed['s']) y += speed;

                x = Math.max(0, Math.min(x, window.innerWidth - CHAR_SIZE));
                y = Math.max(0, Math.min(y, window.innerHeight - CHAR_SIZE));

                const newPos = { x, y };
                socket.emit('move', { roomId, move: newPos });

                return { ...prev, [playerId]: newPos };
            });

            animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);

        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current[e.key.toLowerCase()] = true;
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [playerId]);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <h2 style={{ textAlign: 'center', padding: 20 }}>Multiplayer Room: {roomId}</h2>

            {Object.entries(players).map(([id, pos]) => (
                <div
                    key={id}
                    className="absolute text-center text-xs"
                    style={{
                        left: pos.x,
                        top: pos.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {id === playerId ? 'You' : 'Player'}
                    <br />
                    <Image
                        src={id === playerId ? '/max_planck.png' : '/einstein.png'}
                        alt="char"
                        width={CHAR_SIZE}
                        height={CHAR_SIZE}
                    />
                </div>
            ))}
        </div>
    );
}
