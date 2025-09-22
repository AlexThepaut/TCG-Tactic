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
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      name: 'Play',
      href: '/game',
      icon: PlayIcon,
      iconSolid: PlayIconSolid,
    },
    {
      name: 'Collection',
      href: '/collection',
      icon: RectangleStackIcon,
      iconSolid: RectangleStackIconSolid,
    },
    {
      name: 'Deck Builder',
      href: '/deck-builder',
      icon: WrenchScrewdriverIcon,
      iconSolid: WrenchScrewdriverIconSolid,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      iconSolid: UserIconSolid,
    },
    {
      name: 'Help',
      href: '/help',
      icon: QuestionMarkCircleIcon,
      iconSolid: QuestionMarkCircleIconSolid,
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

  return (
    <nav className="cyber-panel border-b-2 border-neon-cyan-500/30 sticky top-0 z-40 scanlines">
      {/* Navigation glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan-500/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-4 text-neon-cyan-400 hover:text-neon-cyan-300 transition-all duration-300 group"
            >
              <div className="w-10 h-10 cyber-card-container rounded-xl flex items-center justify-center font-cyber font-bold text-sm neon-glow-cyan group-hover:scale-110 transition-transform duration-300">
                <span className="neon-text-cyan">TCG</span>
              </div>
              <span className="font-cyber font-bold text-xl tracking-wider uppercase neon-text-cyan">
                TCG TACTIQUE
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const IconComponent = isActive ? item.iconSolid : item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'neon-button flex items-center px-5 py-3 rounded-xl text-sm font-bold font-cyber tracking-wider uppercase transition-all duration-300 group',
                    isActive
                      ? 'text-neon-cyan-300 border-neon-cyan-300 neon-glow-cyan'
                      : 'text-cyber-muted border-cyber-border hover:text-neon-cyan-400 hover:border-neon-cyan-400'
                  )}
                >
                  <IconComponent className={clsx(
                    'w-5 h-5 mr-2 transition-all duration-300',
                    isActive ? 'text-neon-cyan-300' : 'group-hover:text-neon-cyan-400'
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-3 rounded-lg cyber-panel text-cyber-muted hover:text-neon-cyan-400 transition-all duration-300 hover:neon-glow-cyan group"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6 group-hover:animate-spin" />
              ) : (
                <Bars3Icon className="h-6 w-6 group-hover:animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-4 pb-6 space-y-3 cyber-panel border-t-2 border-neon-cyan-500/30 relative">
            {/* Mobile menu background effects */}
            <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan-500/5 to-transparent pointer-events-none" />

            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const IconComponent = isActive ? item.iconSolid : item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center px-4 py-3 rounded-xl text-base font-bold font-cyber tracking-wider uppercase transition-all duration-300 relative z-10',
                    'neon-button',
                    isActive
                      ? 'text-neon-cyan-300 border-neon-cyan-300 neon-glow-cyan'
                      : 'text-cyber-muted border-cyber-border hover:text-neon-cyan-400 hover:border-neon-cyan-400'
                  )}
                >
                  <IconComponent className={clsx(
                    'w-6 h-6 mr-3 transition-all duration-300',
                    isActive ? 'text-neon-cyan-300' : 'hover:text-neon-cyan-400'
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;