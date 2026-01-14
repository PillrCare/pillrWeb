'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function GenerateCode() {
  const [code, setCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [open, setOpen] = useState(false);
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
    <div className="w-full">
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
      >
        Connect Caregiver
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-background border rounded-lg shadow-xl p-6 text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Your Connection Code</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-sm px-2 py-1 rounded border hover:bg-muted"
              >
                Close
              </button>
            </div>

            {code ? (
              <>
                <div className="text-4xl font-mono tracking-widest font-bold my-2 text-blue-600">
                  {code}
                </div>
                <p className="text-sm text-muted-foreground">
                  Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
                <button
                  onClick={generate}
                  className="mt-2 text-sm underline text-muted-foreground"
                >
                  Generate New Code
                </button>
              </>
            ) : (
              <p>Loading code...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}