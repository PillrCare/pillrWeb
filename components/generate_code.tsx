'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

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
      <Button
        onClick={() => setOpen(true)}
        variant="default"
        size="default"
      >
        Connect Caregiver
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <Card className="relative z-10 w-full max-w-md text-center">
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
              <CardTitle>Your Connection Code</CardTitle>
              <CardDescription>Share this code with your caregiver to connect</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {code ? (
                <>
                  <div className="text-5xl font-mono tracking-widest font-bold my-4 text-primary">
                    {code}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Loading code...</p>
              )}
            </CardContent>

            {code && (
              <CardFooter>
                <Button
                  onClick={generate}
                  variant="outline"
                  className="w-full"
                >
                  Generate New Code
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}