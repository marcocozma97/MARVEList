import { useEffect, useState } from 'react';
import { userService } from '../services/userService';

export type NicknameStatus = 'idle' | 'checking' | 'ok' | 'taken';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

export const useNicknameCheck = (value: string, current?: string | null): NicknameStatus => {
  const name = normalize(value);
  const [result, setResult] = useState<{ name: string; available: boolean } | null>(null);
  const skip = name.length < 2 || name.length > 30 || name.toLowerCase() === (current ?? '').trim().toLowerCase();

  useEffect(() => {
    if (skip) return;
    const timer = window.setTimeout(() => {
      userService.isNicknameAvailable(name)
        .then(available => setResult({ name, available }))
        .catch(() => setResult({ name, available: true }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [name, skip]);

  if (skip) return 'idle';
  if (result?.name !== name) return 'checking';
  return result.available ? 'ok' : 'taken';
};
