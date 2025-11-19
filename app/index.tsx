import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir al dashboard después de que el layout se monte
    setTimeout(() => {
      router.replace('/dashboard');
    }, 0);
  }, [router]);
  
  return null;
}