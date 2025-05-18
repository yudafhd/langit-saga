import { useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLocalStorage<T = any>(key: string) {

    const getItem = useCallback(async (): Promise<T | null> => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : null;
        } catch (error) {
            console.error(`❌ Failed to get localStorage item for key: ${key}`, error);
            return null;
        }
    }, [key]);

    // Simpan data ke localStorage
    const setItem = useCallback(async (value: T): Promise<void> => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`❌ Failed to set localStorage item for key: ${key}`, error);
        }
    }, [key]);

    // Hapus data dari localStorage
    const removeItem = useCallback(async (): Promise<void> => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`❌ Failed to remove localStorage item for key: ${key}`, error);
        }
    }, [key]);

    return { getItem, setItem, removeItem };
}
