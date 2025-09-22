import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  PlayIcon,
  RectangleStackIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlayIcon as PlayIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  UserIcon as UserIconSolid,
  QuestionMarkCircleIcon as QuestionMarkCircleIconSolid,
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Command',
      href: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      color: 'imperial',
    },
    {
      name: 'Deploy',
      href: '/game',
      icon: PlayIcon,
      iconSolid: PlayIconSolid,
      color: 'humans',
    },
    {
      name: 'Archives',
      href: '/collection',
      icon: RectangleStackIcon,
      iconSolid: RectangleStackIconSolid,
      color: 'aliens',
    },
    {
      name: 'Forge',
      href: '/deck-builder',
      icon: WrenchScrewdriverIcon,
      iconSolid: WrenchScrewdriverIconSolid,
      color: 'robots',
    },
    {
      name: 'Operative',
      href: '/profile',
      icon: UserIcon,
      iconSolid: UserIconSolid,
      color: 'void',
    },
    {
      name: 'Intel',
      href: '/help',
      icon: QuestionMarkCircleIcon,
      iconSolid: QuestionMarkCircleIconSolid,
      color: 'void',
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      imperial: {
        active: 'bg-imperial-600/80 text-imperial-100 border-imperial-400/50 box-glow-imperial',
        inactive: 'text-imperial-300 hover:text-imperial-200 hover:bg-imperial-800/30 border-imperial-700/30',
        icon: isActive ? 'text-imperial-300 icon-glow-imperial' : 'text-imperial-400',
        iconHover: 'hover:icon-glow-imperial'
      },
      humans: {
        active: 'bg-humans-600/80 text-humans-100 border-humans-400/50 box-glow-humans',
        inactive: 'text-humans-300 hover:text-humans-200 hover:bg-humans-800/30 border-humans-700/30',
        icon: isActive ? 'text-humans-300 icon-glow-humans' : 'text-humans-400',
        iconHover: 'hover:icon-glow-humans'
      },
      aliens: {
        active: 'bg-aliens-600/80 text-aliens-100 border-aliens-400/50 box-glow-aliens',
        inactive: 'text-aliens-300 hover:text-aliens-200 hover:bg-aliens-800/30 border-aliens-700/30',
        icon: isActive ? 'text-aliens-300 icon-glow-aliens' : 'text-aliens-400',
        iconHover: 'hover:icon-glow-aliens'
      },
      robots: {
        active: 'bg-robots-600/80 text-robots-100 border-robots-400/50 box-glow-robots',
        inactive: 'text-robots-300 hover:text-robots-200 hover:bg-robots-800/30 border-robots-700/30',
        icon: isActive ? 'text-robots-300 icon-glow-robots' : 'text-robots-400',
        iconHover: 'hover:icon-glow-robots'
      },
      void: {
        active: 'bg-void-600/80 text-void-100 border-void-400/50 box-glow-void',
        inactive: 'text-void-300 hover:text-void-200 hover:bg-void-800/30 border-void-700/30',
        icon: isActive ? 'text-void-300 icon-glow-void' : 'text-void-400',
        iconHover: 'hover:icon-glow-void'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.void;
  };

  return (
    <nav className="bg-gothic-darkest/95 backdrop-blur-sm border-b-2 border-imperial-700/40 sticky top-0 z-40 relative">
      {/* Top atmospheric line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-3 text-imperial-200 hover:text-imperial-300 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-imperial-600 to-imperial-800 border border-imperial-500/50 flex items-center justify-center font-tech font-bold text-sm text-imperial-100 group-hover:box-glow-imperial transition-all">
                <span className="gothic-text-shadow">TCG</span>
              </div>
              <span className="font-display font-black text-xl gothic-text-shadow tracking-wider">
                TCG TACTIQUE
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const IconComponent = isActive ? item.iconSolid : item.icon;
              const colors = getColorClasses(item.color, isActive);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center px-4 py-2 border font-tech font-medium text-sm tracking-wide transition-all duration-300 relative group',
                    isActive
                      ? colors.active
                      : colors.inactive + ' border-gothic-medium/30'
                  )}
                >
                  <IconComponent className={clsx('w-5 h-5 mr-2 transition-all', colors.icon,
                    !isActive && colors.iconHover
                  )} />
                  <span className="gothic-text-shadow">{item.name}</span>
                  {/* Scan line effect on hover */}
                  {!isActive && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-10 animate-scan"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-imperial-400 hover:text-imperial-300 focus:outline-none focus:text-imperial-200 transition-all duration-300 p-2 border border-gothic-medium/30 hover:border-imperial-600/50"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6 icon-glow-imperial" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-imperial-700/40">
          <div className="px-3 pt-3 pb-4 space-y-2 bg-gothic-darker/95 backdrop-blur-sm relative">
            {/* Atmospheric effects for mobile menu */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
            </div>

            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const IconComponent = isActive ? item.iconSolid : item.icon;
              const colors = getColorClasses(item.color, isActive);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center px-4 py-3 border font-tech font-medium text-base tracking-wide transition-all duration-300 relative group',
                    isActive
                      ? colors.active
                      : colors.inactive + ' border-gothic-medium/30'
                  )}
                >
                  <IconComponent className={clsx('w-6 h-6 mr-3 transition-all', colors.icon,
                    !isActive && colors.iconHover
                  )} />
                  <span className="gothic-text-shadow">{item.name}</span>
                  {/* Bottom accent line */}
                  <div className={clsx(
                    'absolute bottom-0 left-0 w-full h-px transition-all',
                    isActive ? 'bg-current opacity-60' : 'bg-current opacity-0 group-hover:opacity-30'
                  )}></div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom atmospheric line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-40"></div>
    </nav>
  );
};

export default Navigation;