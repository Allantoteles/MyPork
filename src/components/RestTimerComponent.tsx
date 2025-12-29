import React, { useEffect } from 'react';

interface RestTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  progress: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onFinish: () => void;
}

export const RestTimerComponent: React.FC<RestTimerProps> = ({
  secondsLeft,
  totalSeconds,
  isRunning,
  progress,
  onStart,
  onPause,
  onReset,
  onFinish
}) => {
  
  // Auto-finish cuando llega a cero
  useEffect(() => {
    if (secondsLeft === 0) {
      onFinish();
    }
  }, [secondsLeft, onFinish]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="text-3xl font-bold font-mono text-white">
        {formatTime(secondsLeft)}
      </div>
      
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${100 - progress}%` }} 
        />
      </div>

      <div className="flex items-center gap-2 mt-2 w-full">
        {!isRunning ? (
          <button 
            onClick={onStart} 
            className="flex-1 py-2 bg-primary text-background-dark font-bold rounded-lg text-sm"
          >
            Reanudar
          </button>
        ) : (
          <button 
            onClick={onPause} 
            className="flex-1 py-2 bg-white/10 text-white font-bold rounded-lg text-sm"
          >
            Pausar
          </button>
        )}
        
        <button 
          onClick={() => onFinish()} 
          className="px-4 py-2 bg-transparent text-text-secondary font-bold text-sm hover:text-white"
        >
          Saltar
        </button>

        <button 
          onClick={() => onReset()}
          className="px-4 py-2 bg-transparent text-text-secondary font-bold text-sm hover:text-white"
        >
          +30s
        </button>
      </div>
    </div>
  );
};
