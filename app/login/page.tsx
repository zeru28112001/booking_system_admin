'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/schemas';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock, Mail, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

const MAX_FAILED_ATTEMPTS = Number(process.env.NEXT_PUBLIC_MAX_FAILED_ATTEMPTS) || 5;
const LOCKOUT_DURATION_SECONDS = Number(process.env.NEXT_PUBLIC_LOCKOUT_DURATION_SECONDS) || 60;

export default function LoginPage() {
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutSeconds > 0) {
      interval = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0); // Reset attempts after lockout expires
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: 'admin@booklocal.com',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (lockoutSeconds > 0) return;

    setErrorMsg('');
    try {
      await login(data.identifier, data.password);
      setFailedAttempts(0);
    } catch (err: any) {
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);

      if (newCount >= MAX_FAILED_ATTEMPTS) {
        setLockoutSeconds(LOCKOUT_DURATION_SECONDS);
        setErrorMsg(`Security Lockout Activated: Too many failed login attempts (${newCount}/${MAX_FAILED_ATTEMPTS}). Locked for ${LOCKOUT_DURATION_SECONDS}s.`);
      } else {
        const remaining = MAX_FAILED_ATTEMPTS - newCount;
        setErrorMsg(
          err.message ||
          `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before security lockout.`
        );
      }
    }
  };

  const isLockedOut = lockoutSeconds > 0;

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background visual elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-2xl relative z-10 rounded-2xl">
        <CardHeader className="space-y-4 text-center pb-7 px-8 border-b border-zinc-800/80">

          <div>
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl font-bold text-zinc-100 tracking-tight">Admin Portal</CardTitle>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 px-8  pb-4">
            {/* Lockout Warning Banner */}
            {isLockedOut && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400 space-y-1">
                <div className="flex items-center gap-2 font-bold text-red-300">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                  Account Temporarily Locked
                </div>
                <p className="text-[11px] text-red-300/80">
                  Too many failed authentication attempts. Please wait{' '}
                  <strong className="text-red-200 font-mono text-xs">{lockoutSeconds}s</strong> before trying again.
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && !isLockedOut && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Failed Attempts Badge */}
            {failedAttempts > 0 && !isLockedOut && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400">
                <span>Failed Attempt Warning:</span>
                <span className="font-semibold">{failedAttempts} / {MAX_FAILED_ATTEMPTS} attempts</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-semibold text-zinc-300">
                Admin Email or Phone
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="admin@booklocal.com or 09999999999"
                  disabled={isLockedOut}
                  {...register('identifier')}
                  className="h-11 pl-10 bg-zinc-950/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-sm focus-visible:ring-indigo-500 disabled:opacity-50 rounded-xl"
                />
              </div>
              {errors.identifier && (
                <p className="text-xs text-red-400">{errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-zinc-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLockedOut}
                  {...register('password')}
                  className="h-11 pl-10 bg-zinc-950/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-sm focus-visible:ring-indigo-500 disabled:opacity-50 rounded-xl"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="px-8 pt-3 pb-8">
            <Button
              type="submit"
              disabled={isSubmitting || isLockedOut}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm h-11 rounded-xl shadow-xl shadow-indigo-600/25 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : isLockedOut ? (
                `Locked (${lockoutSeconds}s)`
              ) : (
                'Sign In to Admin Panel'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


