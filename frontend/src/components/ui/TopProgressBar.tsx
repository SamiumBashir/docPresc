import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const TopProgressBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Route change initiated: Start fast surge to ~75%
    setIsVisible(true);
    setProgress(25);

    const stepTimer1 = setTimeout(() => {
      setProgress(65);
    }, 120);

    const stepTimer2 = setTimeout(() => {
      setProgress(90);
    }, 250);

    const completeTimer = setTimeout(() => {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(hideTimer);
    }, 400);

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(completeTimer);
    };
  }, [location.pathname, location.search]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] bg-transparent overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-medical-600 via-teal-400 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(45,212,191,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 0 ? 'none' : 'width 250ms ease-out, opacity 200ms ease-in',
        }}
      />
    </div>
  );
};
