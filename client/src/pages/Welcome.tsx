import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import { APP_LOGO, APP_TITLE } from '@/const';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap } from 'lucide-react';

interface WelcomeProps {
  onEnter: () => void;
}

export default function Welcome({ onEnter }: WelcomeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <div 
          className="text-center space-y-8 animate-fade-in"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {APP_LOGO && (
              <img 
                src={APP_LOGO} 
                alt={APP_TITLE} 
                className={`h-24 w-24 transition-all duration-500 ${
                  isHovered ? 'scale-110 rotate-12' : 'scale-100'
                }`}
              />
            )}
          </div>
          
          {/* Title with gradient */}
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
            {APP_TITLE}
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto px-4">
            {t('app.subtitle')}
          </p>

          {/* Tagline */}
          <p className="text-lg text-gray-500 italic">
            {t('app.tagline')}
          </p>
          
          {/* Enter button */}
          <div className="pt-8">
            <Button
              size="lg"
              onClick={onEnter}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-12 py-6 text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="h-6 w-6 group-hover:animate-pulse" />
                {t('app.enterSystem')}
                <Zap className="h-6 w-6 group-hover:animate-pulse" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </div>
          
          {/* Hint text */}
          <p className="text-sm text-gray-600 animate-pulse pt-4">
            {t('app.startJourney')}
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}
