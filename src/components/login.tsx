'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import styles from "./styles"
import { useLocalStorage } from '@/helpers/localStorage';
export default function Login() {
    const router = useRouter();
    const localStorage = useLocalStorage('userId')
    const [userId, setUserId] = useState('');
    const [localStorageUserId, setLocalStorageUserId] = useState('');

    useEffect(() => {
        const handleGetUserId = async () => {
            await localStorage.getItem().then((value: string) => {
                setLocalStorageUserId(value)
            })
        }
        handleGetUserId()
    }, [localStorage]);

    const handleSaveUserId = () => {
        localStorage.setItem(userId)
        setLocalStorageUserId(userId)
    }
    const goTo = () => {
        router.push('/floor-1')
    }

    return (
        <div className={styles.mainSection}>
            <div className="h-screen flex justify-center items-center">
                <div>
                    <p className="text-2xl font-bold tracking-tight text-slate-500 p-4 rounded-md">
                        Welcome To Testing Games!
                    </p>
                    <div className=" flex justify-center items-center">
                        <input
                            type="text"
                            placeholder="Create User ID"
                            maxLength={15}
                            className={styles.chatInput}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                        <button onClick={handleSaveUserId} className="[font-size:15px] bg-slate-400 hover:bg-slate-500 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-4">
                            save
                        </button>
                    </div>
                    {localStorageUserId && <div>
                        <p className=" [font-size:12px] tracking-tight text-slate-500 p-4 rounded-md">
                            room : <a href='#' onClick={goTo} className="[font-size:15px] bg-slate-400 hover:bg-slate-500 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-4">
                                football
                            </a>
                        </p>
                    </div>}
                </div>

            </div>
        </div>
    );
}