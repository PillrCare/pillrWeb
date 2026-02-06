'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

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
      <Button
        onClick={() => setOpen(true)}
        variant="default"
        size="default"
      >
        Connect Patient
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <Card className="relative z-10 w-full max-w-md">
            <CardHeader className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4"
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle>Connect to a Patient</CardTitle>
              <CardDescription>Enter the 6-digit connection code provided by the patient</CardDescription>
            </CardHeader>

            <form onSubmit={handleConnect}>
              <CardContent className="flex flex-col gap-4">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="font-mono text-center text-2xl tracking-widest h-16"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                />
                {message && (
                  <p className={`text-center text-sm font-medium ${message.includes('Success') ? 'text-green-600' : 'text-destructive'}`}>
                    {message}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={loading || inputCode.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}