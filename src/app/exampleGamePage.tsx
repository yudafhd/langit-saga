'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

export default function GamePage() {
  const SPEED = 8;
  const CHAR_SIZE = 80;
  const [charOne, setCharOnePosition] = useState({ x: 100, y: 300 });
  const [charTwo, setCharTwoPosition] = useState({ x: 100, y: 400 });
  const [objectPosition] = useState({ x: 500, y: 400 });
  const [objectPositionTwo] = useState({ x: 700, y: 400 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const STAGE_HEIGHT = window.innerHeight;
    const STAGE_WIDTH = window.innerWidth;
    let charOneFrame: number;
    let charTwoFrame: number;
    let lastTimeOne = performance.now();
    let lastTimeTwo = performance.now();

    const updateCharOne = (time: number) => {
      const delta = time - lastTimeOne;
      lastTimeOne = time;
      const speed_walking = SPEED * (delta / 30);

      setCharOnePosition((prev) => {
        let { x, y } = prev;
        const pressed = keysPressed.current;

        if (pressed['a']) x -= speed_walking;
        if (pressed['d']) x += speed_walking;
        if (pressed['w']) y -= speed_walking;
        if (pressed['s']) y += speed_walking;

        x = Math.max(0, Math.min(x, STAGE_WIDTH - (CHAR_SIZE + 20)));
        y = Math.max(0, Math.min(y, STAGE_HEIGHT - (CHAR_SIZE + 20)));

        const newPos = { x, y };
        if (isColliding(newPos, objectPosition)) {
          console.log('CharOne menabrak musuh!');
        }

        return newPos;
      });

      charOneFrame = requestAnimationFrame(updateCharOne);
    };

    const updateCharTwo = (time: number) => {
      const delta = time - lastTimeTwo;
      lastTimeTwo = time;
      const speed_walking = SPEED * (delta / 30);

      setCharTwoPosition((prev) => {
        let { x, y } = prev;
        const pressed = keysPressed.current;

        if (pressed['arrowleft']) x -= speed_walking;
        if (pressed['arrowright']) x += speed_walking;
        if (pressed['arrowup']) y -= speed_walking;
        if (pressed['arrowdown']) y += speed_walking;

        x = Math.max(0, Math.min(x, STAGE_WIDTH - (CHAR_SIZE + 20)));
        y = Math.max(0, Math.min(y, STAGE_HEIGHT - (CHAR_SIZE + 20)));

        const newPos = { x, y };
        if (isColliding(newPos, objectPosition)) {
          console.log('CharTwo menabrak musuh!');
        }

        return newPos;
      });

      charTwoFrame = requestAnimationFrame(updateCharTwo);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    charOneFrame = requestAnimationFrame(updateCharOne);
    charTwoFrame = requestAnimationFrame(updateCharTwo);

    return () => {
      cancelAnimationFrame(charOneFrame);
      cancelAnimationFrame(charTwoFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isColliding = (position: { x: number; y: number }, object: { x: number; y: number }) => {
    return (
      position.x + 50 >= object.x &&
      position.x - 50 <= object.x &&
      position.y + 50 >= object.y &&
      position.y - 50 <= object.y
    );
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
    >
      <div style={{ textAlign: 'center', padding: 20 }}><h2>Ada yang tidak bisa kamu lakukan sendirian</h2></div>
      <div
        className="absolute"
        style={{ left: charOne.x, top: charOne.y }}
      >
        x: {Math.floor(charOne.x)} y: {Math.floor(charOne.y)} <br />
        <Image src="/max_planck.png" alt="max planck" width={CHAR_SIZE} height={CHAR_SIZE} style={{ zIndex: 1 }} />
      </div>
      <div
        className="absolute"
        style={{ left: charTwo.x, top: charTwo.y }}
      >
        x: {Math.floor(charTwo.x)} y: {Math.floor(charTwo.y)} <br />
        <Image src="/einstein.png" alt="einstein" width={CHAR_SIZE} height={CHAR_SIZE} style={{ zIndex: 1 }} />
      </div>

      <div
        className="absolute w-[50px] h-[50px] border rounded bg-white text-black text-sm flex items-center justify-center"
        style={{ left: objectPosition.x, top: objectPosition.y }}
      >
        x: {Math.floor(objectPosition.x)}<br />y: {Math.floor(objectPosition.y)}
      </div>
      <div
        className="absolute w-[50px] h-[50px] border rounded bg-white text-black text-sm flex items-center justify-center"
        style={{ left: objectPositionTwo.x, top: objectPositionTwo.y }}
      >
        x: {Math.floor(objectPositionTwo.x)}<br />y: {Math.floor(objectPositionTwo.y)}
      </div>
    </div>
  );
}
