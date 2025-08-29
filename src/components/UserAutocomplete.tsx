'use client';

import { useState, useEffect, useRef } from 'react';
import { ContactDto } from '@/lib/types';

interface UserAutocompleteProps {
  users: ContactDto[];
  onUserSelect: (user: ContactDto) => void;
  onSearch: (searchTerm: string) => void;
  selectedUser?: ContactDto;
  loading?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function UserAutocomplete({
  users,
  onUserSelect,
  onSearch,
  selectedUser,
  loading = false,
  placeholder = "Search users by name or email...",
  required = false,
  error
}: UserAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set input value when user is selected externally
  useEffect(() => {
    if (selectedUser) {
      setInputValue(`${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`);
    } else {
      setInputValue('');
    }
  }, [selectedUser]);

  // Handle input change and search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // Search with debounce
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Handle user selection
  const handleUserSelect = (user: ContactDto) => {
    onUserSelect(user);
    setInputValue(`${user.firstName} ${user.lastName} (${user.email})`);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < users.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : users.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && users[highlightedIndex]) {
          handleUserSelect(users[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserDisplayText = (user: ContactDto) => {
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserSubText = (user: ContactDto) => {
    return `${user.email}${user.phoneNumber ? ' • ' + user.phoneNumber : ''}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full text-black px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          required={required}
        />
        
        {/* Loading spinner or search icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          ) : (
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading && users.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Searching...
            </div>
          )}
          
          {!loading && users.length === 0 && inputValue && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No users found
            </div>
          )}
          
          {!loading && users.length === 0 && !inputValue && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Type to search users
            </div>
          )}

          {users.map((user, index) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                index === highlightedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Profile picture or placeholder */}
                <div className="flex-shrink-0">
                  {user.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={getUserDisplayText(user)}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {getUserDisplayText(user)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {getUserSubText(user)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}

      {/* Selected user info */}
      {selectedUser && (
        <div className="mt-2 text-xs text-gray-500">
          Selected: <strong>ID {selectedUser.id}</strong>
        </div>
      )}
    </div>
  );
}