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

const SPEED = 8;
const CHAR_SIZE = 80;
const BALL_SIZE = 30;
const leftPosition = 6;
// const rightPosition = 1.2;

export default function GamePage() {

    const roomId = 'quantum football';
    const { getItem } = useLocalStorage<string>('userId');
    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const [screenW, setScreenW] = useState(0)
    const [screenH, setScreenH] = useState(0)
    const [socket, setSocket] = useState<any>(null);
    const [players, setPlayers] = useState<{ [id: string]: { x: number; y: number, userId?: string } }>({});
    const [ball, setBall] = useState<{ x: number; y: number }>({ y: 10, x: 10 });
    const [gateOne] = useState<{ x: number; y: number, w: number, h: number }>({ x: -50, y: 150, w: 300, h: 500 })
    const [gateTwo] = useState<{ x: number; y: number, w: number, h: number }>({ x: -50, y: 150, w: 300, h: 500 })
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

    // set userID
    useEffect(() => {
        const initUserId = async () => {
            const userIdLocal = await getItem();
            setUserIdLocal(userIdLocal || '')
        };

        initUserId();
    }, [getItem]);

    // connection socket
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

    // set area 
    useEffect(() => {
        setScreenW(window.innerWidth)
        setScreenH(window.innerHeight)
    }, []);

    // set ini ball position
    useEffect(() => {
        const y = screenH / 2;
        const x = screenW / leftPosition;
        if (socket) {
            socket.emit('hit-ball', { roomId, y, x })
        }
        setBall({ y, x })
    }, [socket, screenH, screenW]);


    // connetion logic
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

        socket?.on('moving-ball', (position) => {
            setBall({ ...position })
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
            socket?.off('chats-update');
            socket?.off('moving-ball');
            socket?.off('player-left');
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

                    x = Math.max(0, Math.min(x, screenW - 100));
                    y = Math.max(0, Math.min(y, screenH - 100));

                    const newPos = { x, y, userId: userIdLocal };

                    setTimeout(() => socket.emit('move', { roomId, move: newPos }), 30)

                    if (isHitBall(x, y, ball.x, ball.y, 60)) {
                        movingBall()
                    }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenW, screenH, userIdLocal, socketId, isFocused, socket, ball]);


    // const isCircleRectCollision = (circle, rect) => {
    //     const distX = Math.abs(circle.x - (rect.x + rect.w / 2));
    //     const distY = Math.abs(circle.y - (rect.y + rect.h / 2));

    //     if (distX > (rect.w / 2 + circle.r)) return false;
    //     if (distY > (rect.h / 2 + circle.r)) return false;

    //     if (distX <= (rect.w / 2)) return true;
    //     if (distY <= (rect.h / 2)) return true;

    //     const dx = distX - rect.w / 2;
    //     const dy = distY - rect.h / 2;
    //     return (dx * dx + dy * dy <= circle.radius * circle.radius);
    // }

    const isHitBall = (x: number, y: number, ballX: number, ballY: number, radius: number) => {
        const dx = x - ballX;
        const dy = y - ballY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance <= radius;
    };

    const movingBall = () => {
        const x = Math.random() * (screenW - BALL_SIZE);
        const y = Math.random() * (screenH - BALL_SIZE);
        socket.emit('hit-ball', { roomId, x, y })
        setBall({ x, y });
    }

    const bubbleChat = () => {
        return chats.map((chat: Chat, index: number) =>
            <p key={index}>{chat?.userId} : {chat?.text}</p>
        )
    }

    return (
        <div className={styles.mainSection}>
            <div className={styles.title}> {roomId}</div>
            <div className={styles.descriptionSection}>
                <div><b>GATE 1</b><br /> score : 0</div>
                <div className={styles.description}>
                    Sphera Ball — bola sains ajaib yang bergerak tak terduga,
                    menembus logika dan menantang hukum fisika. Sentuh saat ia berhenti,
                    dan rahasia dimensi tersembunyi akan terbuka.
                </div>
                <div><b>GATE 2</b><br /> score : 0</div>
            </div>
            {/* <div className={styles.goalDescription} style={{ position: "absolute" }}>
                <div>
                    <p className={styles.goalTitle}>GOAL ON GATE 1</p>
                    Sphera Ball seperti kehidupan, kita tidak tahu arahnya ke mana,
                    tapi jika kita terus berusaha, semesta akan menunjukkan jalannya.
                </div>
            </div> */}
            {ball && <div id='ball' style={{
                position: "absolute",
                top: ball.y, left: ball.x,
                transition: 'left 0.5s ease, top 0.5s ease',
                animation: "bounce 1s infinite alternate"
            }} >
                <Image
                    src={'/soccer_ball.png'}
                    alt="ball"
                    loading='lazy'
                    width={BALL_SIZE}
                    height={BALL_SIZE}
                />
            </div>}
            <div style={{ position: "absolute", right: gateOne.x, top: gateOne.y, height: gateOne.h, width: gateOne.w, }}>
                <Image
                    src={'/yunani_door.png'}
                    alt="char"
                    loading='lazy'
                    fill
                />
            </div>
            <div style={{ transform: 'scaleX(-1)', position: "absolute", left: gateTwo.x, top: gateTwo.y, height: gateTwo.h, width: gateTwo.w, }}>
                <Image
                    src={'/yunani_door.png'}
                    alt="char"
                    loading='lazy'
                    fill
                />
            </div>
            {socketId ? Object.entries(players).map(([id, data]) => (
                <div
                    key={id}
                    className={styles.player}
                    style={{
                        left: data.x,
                        top: data.y,
                    }}
                >
                    <span className={styles.playerName}>
                        {data?.userId ? data?.userId : userIdLocal}
                    </span>
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
