'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ConnectPatient() {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.rpc('connect_with_code', {
      input_code: inputCode
    });

    setLoading(false);

    if (error) {
      setMessage('System error. Please try again.');
      return;
    }

    if (data && data.success) {
      setMessage('Success! Redirecting...');
      router.refresh(); // Refresh to show new patient in list
    } else {
      setMessage(data?.message || 'Failed to connect');
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
      >
        <span>Connect Patient</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-background border rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Connect to a Patient</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-sm px-2 py-1 rounded border hover:bg-muted"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleConnect} className="flex flex-col gap-4">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="border p-2 rounded font-mono text-center text-lg"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
              <button
                disabled={loading || inputCode.length !== 6}
                className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
              {message && <p className="text-center text-sm font-bold">{message}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}