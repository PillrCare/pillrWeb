'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function GenerateCode() {
  const [code, setCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const supabase = createClient();

  const generate = async () => {
    const { data, error } = await supabase.rpc('generate_connection_code');
    
    if (error) {
      console.error('Error generating code:', error);
      return;
    }

    if (data && data.length > 0) {
      // UPDATED HERE: use 'generated_code' and 'generated_expiry'
      setCode(data[0].generated_code);
      
      const expires = new Date(data[0].generated_expiry).getTime();
      const now = new Date().getTime();
      setTimeLeft(Math.floor((expires - now) / 1000));
    }
  };

  // Generate on mount
  useEffect(() => { generate(); }, []);

  // Simple countdown timer logic
  useEffect(() => {
    if (!timeLeft) return;
    const intervalId = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  return (
    <div className="p-6 border rounded-lg text-center">
      <h3 className="text-lg font-bold mb-4">Your Connection Code</h3>
      {code ? (
        <>
          <div className="text-4xl font-mono tracking-widest font-bold my-4 text-blue-600">
            {code}
          </div>
          <p className="text-sm text-gray-500">
            Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </p>
          <button 
            onClick={generate} 
            className="mt-4 text-sm underline text-gray-600"
          >
            Generate New Code
          </button>
        </>
      ) : (
        <p>Loading code...</p>
      )}
    </div>
  );
}