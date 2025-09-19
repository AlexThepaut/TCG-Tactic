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
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-3 text-white hover:text-blue-400 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
                TCG
              </div>
              <span className="font-display font-bold text-xl">
                TCG Tactique
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const IconComponent = isActive ? item.iconSolid : item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-400 hover:text-white focus:outline-none focus:text-white transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const IconComponent = isActive ? item.iconSolid : item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center px-3 py-2 rounded-md text-base font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  )}
                >
                  <IconComponent className="w-6 h-6 mr-3" />
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