/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import io from 'socket.io-client';

import { useLocalStorage } from '@/helpers/localStorage';
type Chat = {
    userId?: string,
    text?: string
}

import styles from "./styles"

export default function GamePage() {
    const SPEED = 8;
    const CHAR_SIZE = 80;
    const roomId = 'room-001';
    const { getItem } = useLocalStorage<string>('userId');
    const keysPressed = useRef<{ [key: string]: boolean }>({});

    const [socket, setSocket] = useState<any>(null);
    const [players, setPlayers] = useState<{ [id: string]: { x: number; y: number, userId?: string } }>({});
    const [socketId, setSocketId] = useState<string>('');
    const [chats, setChats] = useState<Chat[]>([]);
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [userIdLocal, setUserIdLocal] = useState('');

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleSend = () => {
        const trimmed = text.trim();
        if (trimmed.length === 0) return;
        setChats((prev: Chat[]) => {
            if (prev.length === 4) {
                prev.shift()
            }
            return [...prev, { socketId, userId: userIdLocal, text }]
        });
        socket.emit('chat-message', { roomId, userId: userIdLocal, text })
        setText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        const initUserId = async () => {
            const userIdLocal = await getItem(); // menunggu hasil getItem()
            setUserIdLocal(userIdLocal || '')
        };

        initUserId();
    }, [getItem]);

    useEffect(() => {
        const socketInstance = io('', {
            path: '/api/socket',
            auth: { userId: userIdLocal },
        });

        setSocket(socketInstance);
        return () => {
            socketInstance.disconnect();
        };
    }, [userIdLocal])

    useEffect(() => {
        socket?.emit('join-room', roomId);

        socket?.on('connect', () => {
            setSocketId(socket.id || '')
        });

        socket?.on('init-players', (initialPlayers) => {
            setPlayers(initialPlayers);
        });

        socket?.on('player-joined', ({ id, pos, userId }) => {
            setPlayers((prev) => ({ ...prev, [id]: { ...pos, userId } }));
        });

        socket?.on('player-moved', ({ id, pos }) => {
            setPlayers((prev) => ({ ...prev, [id]: pos }));
        });

        socket?.on('chats-update', ({ userId, text }) => {
            setChats(prev => {
                if (prev.length === 4) {
                    prev.shift()
                }
                return [...prev, { userId, text }]
            });
        });

        socket?.on('player-left', (id) => {
            setPlayers((prev) => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        });

        return () => {
            socket?.off('connect');
            socket?.off('init-players');
            socket?.off('player-joined');
            socket?.off('player-moved');
            socket?.off('player-left');
            socket?.off('chats-update');
        };
    }, [socket]);

    useEffect(() => {
        if (!socketId) return;
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
                    const myPos = prev[socketId];
                    if (!myPos) return prev;
                    let { x, y } = myPos;

                    if (pressA) x -= speed;
                    if (pressD) x += speed;
                    if (pressW) y -= speed;
                    if (pressS) y += speed;

                    x = Math.max(0, Math.min(x, window.innerWidth));
                    y = Math.max(0, Math.min(y, window.innerHeight));

                    const newPos = { x, y, userId: userIdLocal };

                    setTimeout(() => socket.emit('move', { roomId, move: newPos }), 30)

                    return { ...prev, [socketId]: newPos };
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
    }, [userIdLocal, socketId, isFocused, socket]);

    const bubbleChat = () => {
        return chats.map((chat: Chat, index: number) =>
            <p key={index}>{chat?.userId} : {chat?.text}</p>
        )
    }

    return (
        <div className={styles.mainSection}>
            <div className={styles.title}> {roomId}</div>
            {socketId ? Object.entries(players).map(([id, data]) => (
                <div
                    key={id}
                    className={styles.player}
                    style={{
                        left: data.x,
                        top: data.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {data?.userId ? data?.userId : userIdLocal}
                    <br />
                    <Image
                        src={id === socketId ? '/einstein.png' : '/nikola.png'}
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
                    placeholder="chat your friend"
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
