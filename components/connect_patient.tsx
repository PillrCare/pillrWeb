'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ConnectPatient() {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-bold mb-4">Connect to a Patient</h3>
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
  );
}