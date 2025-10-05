import { useEffect, useRef, useState } from 'react';

// Lightning Logo Component
export const LightningLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 32 
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Lightning Bolt */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        className="lightning-bolt animate-lightning-strike"
      >
        <path 
          d="M13 2L3 14h6l-2 8 10-12h-6l2-8z" 
          stroke="url(#lightning-gradient)" 
          strokeWidth="2" 
          fill="url(#lightning-fill)"
        />
        <defs>
          <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(203.8863, 88.2845%, 53.1373%)" />
            <stop offset="100%" stopColor="hsl(159.7826, 100%, 36.0784%)" />
          </linearGradient>
          <linearGradient id="lightning-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(203.8863, 88.2845%, 53.1373%, 0.2)" />
            <stop offset="100%" stopColor="hsl(159.7826, 100%, 36.0784%, 0.1)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Electric Particles */}
      <div className="absolute inset-0 electric-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 lightning-glow rounded-full"></div>
    </div>
  );
};

// Electric Loading Spinner
export const ElectricLoader: React.FC<{ size?: number }> = ({ size = 80 }) => {
  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox="0 0 80 80">
        {/* Circuit paths */}
        <g stroke="hsl(203.8863, 88.2845%, 53.1373%)" strokeWidth="2" fill="none">
          <path d="M10,40 L30,40" className="circuit-path" style={{ animationDelay: '0s' }} />
          <path d="M50,40 L70,40" className="circuit-path" style={{ animationDelay: '0.5s' }} />
          <path d="M40,10 L40,30" className="circuit-path" style={{ animationDelay: '1s' }} />
          <path d="M40,50 L40,70" className="circuit-path" style={{ animationDelay: '1.5s' }} />
        </g>
        
        {/* Moving energy pulse */}
        <circle r="3" fill="hsl(159.7826, 100%, 36.0784%)" className="drop-shadow-lg">
          <animateMotion dur="3s" repeatCount="indefinite">
            <path d="M10,40 L30,40 L40,30 L40,10 M40,30 L50,40 L70,40 M50,40 L40,50 L40,70" />
          </animateMotion>
        </circle>
        
        {/* Connection nodes */}
        <circle cx="30" cy="40" r="4" fill="hsl(203.8863, 88.2845%, 53.1373%)" className="animate-pulse" />
        <circle cx="50" cy="40" r="4" fill="hsl(203.8863, 88.2845%, 53.1373%)" className="animate-pulse" />
        <circle cx="40" cy="30" r="4" fill="hsl(203.8863, 88.2845%, 53.1373%)" className="animate-pulse" />
        <circle cx="40" cy="50" r="4" fill="hsl(203.8863, 88.2845%, 53.1373%)" className="animate-pulse" />
      </svg>
    </div>
  );
};

// Electric Button Component
export const ElectricButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}> = ({ children, onClick, size = 'md', variant = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const baseClasses = variant === 'primary' 
    ? 'btn-electric font-semibold rounded-lg transition-all duration-300'
    : 'btn-electric-secondary font-semibold rounded-lg border-2 border-current bg-transparent hover:bg-current hover:text-white transition-all duration-300';

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Lightning Field Background
export const LightningField: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`lightning-field ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
    </div>
  );
};

// Electric Text Effect
export const ElectricText: React.FC<{
  children: string;
  className?: string;
  glowEffect?: boolean;
}> = ({ children, className = '', glowEffect = true }) => {
  return (
    <span 
      className={`electric-text ${glowEffect ? 'drop-shadow-lg' : ''} ${className}`}
      data-text={children}
    >
      {children}
    </span>
  );
};

// Interactive Cursor Effect (Hook)
export const useElectricCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX - 10}px`;
      cursor.style.top = `${e.clientY - 10}px`;
    };

    const handleMouseDown = () => {
      cursor.classList.add('active');
    };

    const handleMouseUp = () => {
      cursor.classList.remove('active');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const ElectricCursor = () => (
    <div ref={cursorRef} className="electric-cursor" />
  );

  return ElectricCursor;
};

// Electric Card Component
export const ElectricCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}> = ({ children, className = '', hover = true }) => {
  return (
    <div 
      className={`
        bg-bolt-elements-bg-depth-2 
        border border-bolt-elements-borderColor 
        rounded-lg p-6 
        ${hover ? 'hover-power-up cursor-pointer' : ''}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Electric Hero Section
export const ElectricHero: React.FC<{
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const ElectricCursor = useElectricCursor();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Lightning Background */}
      <LightningField className="absolute inset-0" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <LightningLogo size={64} className="mx-auto" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-scaleIn">
          <ElectricText glowEffect>{title}</ElectricText>
        </h1>
        
        {subtitle && (
          <p className="text-lg md:text-xl text-bolt-elements-textSecondary mb-8 animate-slideInFromBottom">
            {subtitle}
          </p>
        )}
        
        {children && (
          <div className="animate-slideInFromBottom" style={{ animationDelay: '0.2s' }}>
            {children}
          </div>
        )}
      </div>
      
      {/* Interactive Cursor */}
      <ElectricCursor />
    </section>
  );
};

// Electric Loading State
export const ElectricLoadingState: React.FC<{ message?: string }> = ({ 
  message = "Charging up..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="mb-4">
        <ElectricLoader />
      </div>
      <p className="text-bolt-elements-textSecondary text-sm typing-cursor">
        {message}
      </p>
    </div>
  );
};

// Electric Navigation Item
export const ElectricNavItem: React.FC<{
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}> = ({ children, active = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-md transition-all duration-300
        ${active 
          ? 'text-bolt-elements-textPrimary bg-bolt-elements-item-backgroundAccent' 
          : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
        }
        hover-power-up
      `}
    >
      {children}
      {active && (
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-bolt-elements-icon-primary to-transparent opacity-20 animate-shimmer"></div>
      )}
    </button>
  );
};