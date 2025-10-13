import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center px-4 py-2 border border-amber-600/50 hover:border-amber-400 text-amber-300 hover:text-amber-200 font-medium text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/50 rounded">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-500/50 flex items-center justify-center mr-3">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.username} className="w-full h-full rounded-full" />
          ) : (
            <UserIcon className="w-5 h-5 text-amber-200" />
          )}
        </div>
        <span className="font-bold">{user.username}</span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-sm border-2 border-amber-600/50 divide-y divide-amber-700/30 focus:outline-none rounded-lg shadow-2xl">
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-amber-300">{user.email}</p>
            <p className="text-xs font-medium text-gray-400 mt-1">
              {user.authProvider === 'google' ? '🔗 Google Account' : '🔐 Local Account'}
            </p>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={clsx(
                    'flex items-center px-4 py-2 text-sm font-medium tracking-wide',
                    active ? 'bg-amber-800/30 text-amber-200' : 'text-amber-300'
                  )}
                >
                  <UserIcon className="w-5 h-5 mr-3" />
                  War Hero Profile
                </Link>
              )}
            </Menu.Item>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={clsx(
                    'flex items-center w-full px-4 py-2 text-sm font-medium tracking-wide',
                    active ? 'bg-red-800/30 text-red-300' : 'text-red-400'
                  )}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  Disengage
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
