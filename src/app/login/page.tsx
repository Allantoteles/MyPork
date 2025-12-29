"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup, signInWithGoogle } from './actions';
import { FcGoogle } from 'react-icons/fc';
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      if (isLogin) {
        const result = await login(formData);
        if (result?.error) {
          setErrorMessage(result.error);
        }
      } else {
        const result = await signup(formData);
        if (result?.error) {
          setErrorMessage(result.error);
        } else if (result?.success) {
          setSuccessMessage(result.success);
        }
      }
    });
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage(null);
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage('Error al conectar con Google. Intenta de nuevo.');
      console.error('Google login error:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark overflow-y-auto z-[100] relative">
      <div className="relative h-32 w-full overflow-hidden rounded-b-[2rem] flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background-dark z-10" />
        <img src="https://picsum.photos/seed/fitness/800/600" alt="Gym" className="w-full h-full object-cover opacity-30" />
      </div>

      <div className="flex-1 px-6 -mt-16 relative z-20 flex flex-col items-center">
        <div className="mb-4 text-center">
          <div className="mb-2 flex justify-center">
            <img 
              src="/MyPorkLogoSinFondo.png" 
              alt="MyPork Logo" 
              className="size-40 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold mb-1">{isLogin ? '¡Bienvenido a FitnessPork!' : 'Únete a FitnessPork'}</h1>
          <p className="text-sm text-text-secondary">
            {isLogin ? 'Ingresa tus datos para continuar' : 'Regístrate para comenzar tu viaje'}
          </p>
        </div>

        {errorMessage && (
          <div className="w-full mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="w-full mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm text-center">
            {successMessage}
          </div>
        )}

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-200 ml-1">Correo electrónico</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                <HiMail size={18} />
              </div>
              <input 
                name="email"
                type="email" 
                required
                placeholder="usuario@gym.com" 
                className="w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-surface-dark text-white focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-all outline-none" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-200 ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                <HiLockClosed size={18} />
              </div>
              <input 
                name="password"
                type={showPassword ? 'text' : 'password'} 
                required
                minLength={6}
                placeholder="••••••••" 
                className="w-full pl-10 pr-12 py-3 border border-white/10 rounded-xl bg-surface-dark text-white focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-all outline-none" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
              </button>
            </div>
            {isLogin && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded bg-surface-dark border-white/10 text-primary focus:ring-primary size-3.5" />
                  <span className="text-[10px] text-text-secondary">Recordar sesión</span>
                </label>
                <button type="button" className="text-xs font-medium text-primary hover:opacity-80">¿Olvidaste tu contraseña?</button>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full py-3.5 bg-primary text-background-dark font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
            {isLogin ? 'Ingresar' : 'Registrarse'}
          </button>
        </form>

        <div className="relative w-full my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center text-[10px]"><span className="px-2 bg-background-dark text-text-secondary uppercase font-bold tracking-widest">O continuar con</span></div>
        </div>

        <div className="w-full">
          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 border border-white/10 rounded-xl bg-surface-dark hover:bg-white/5 transition-colors active:scale-[0.98]"
          >
            <FcGoogle size={20} />
            <span className="text-sm font-bold text-white">Google</span>
          </button>
        </div>

        <p className="mt-6 text-sm text-text-secondary pb-6">
          {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'} 
          <button 
            onClick={() => { setIsLogin(!isLogin); setErrorMessage(null); setSuccessMessage(null); }} 
            className="font-bold text-primary ml-1 hover:underline"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}