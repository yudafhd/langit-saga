'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import io from 'socket.io-client';

type Chat = {
    playerId?: string,
    text?: string
}

const socket = io('', { path: '/api/socket' });

import styles from "./floorOneStyle"

export default function GamePage() {
    const SPEED = 8;
    const CHAR_SIZE = 80;
    const roomId = 'room-001';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socketRef = useRef<any>(null);
    const keysPressed = useRef<{ [key: string]: boolean }>({});

    const [players, setPlayers] = useState<{ [id: string]: { x: number; y: number } }>({});
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleSend = () => {
        const trimmed = text.trim();
        if (trimmed.length === 0) return;
        socket.emit('chat-message', { roomId, playerId, text })
        setText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        socketRef.current = io('', { path: '/api/socket' });
    }, [])

    useEffect(() => {
        socket.emit('join-room', roomId);

        socket.on('connect', () => {
            setPlayerId(socket.id || null)
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

        socket.on('chats-update', ({ playerId, text }) => {
            setChats(prev => {
                if (prev.length === 4) {
                    prev.shift()
                }
                return [...prev, { playerId, text }]
            });
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
            socket.off('chats-update');
        };
    }, []);

    useEffect(() => {
        if (!playerId) return;
        let animationFrame: number;
        let lastTime = performance.now();

        const update = (time: number) => {
            const delta = time - lastTime;
            lastTime = time;
            const speed = SPEED * (delta / 25);
            const pressed = keysPressed.current;
            const pressA = pressed['a'] && !isFocused;
            const pressD = pressed['d'] && !isFocused;
            const pressW = pressed['w'] && !isFocused;
            const pressS = pressed['s'] && !isFocused;
            const isMoving = pressA || pressD || pressW || pressS;

            if (isMoving) {
                setPlayers((prev) => {
                    const myPos = prev[playerId];
                    if (!myPos) return prev;
                    let { x, y } = myPos;

                    if (pressA) x -= speed;
                    if (pressD) x += speed;
                    if (pressW) y -= speed;
                    if (pressS) y += speed;

                    x = Math.max(0, Math.min(x, window.innerWidth));
                    y = Math.max(0, Math.min(y, window.innerHeight));

                    const newPos = { x, y };

                    setTimeout(() => socket.emit('move', { roomId, move: newPos }), 30)

                    return { ...prev, [playerId]: newPos };
                });
            }

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
    }, [playerId, isFocused]);

    const bubbleChat = () => {
        return chats.map((chat: Chat, index: number) => <p key={index}>{playerId === chat?.playerId ? "you" : "player"} : {chat?.text}</p>)
    }

    return (
        <div className={styles.mainSection}>
            <div className={styles.title}> {roomId}</div>
            {playerId ? Object.entries(players).map(([id, pos]) => (
                <div
                    key={id}
                    className={styles.player}
                    style={{
                        left: pos.x,
                        top: pos.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {id === playerId ? 'You' : 'Player'}
                    <br />
                    <Image
                        src={id === playerId ? '/einstein.png' : '/nikola.png'}
                        alt="char"
                        loading='lazy'
                        width={CHAR_SIZE}
                        height={CHAR_SIZE}
                    />
                </div>
            )) : null}
            <div className={styles.chatSection}>
                <div className={styles.chat}>
                    {chats.length === 0 && "Text here...."}
                    {chats ? bubbleChat() : null}
                </div>
            </div>
            <div className={styles.chatInputSection}>
                <input
                    type="text"
                    placeholder="tell your friend"
                    className={styles.chatInput}
                    value={text}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setText(e.target.value)}
                />
            </div>
        </div>
    );
}
