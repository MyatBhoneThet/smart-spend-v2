import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const Modal = ({ isOpen, onClose, title, children }) => {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed top-0 right-0 left-0 z-[9999] flex justify-center items-center w-full h-[calc(100%-1rem)] max-h-full overflow-y-auto overflow-x-hidden bg-black/60">
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className={`relative rounded-lg shadow-lg border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className={`flex items-center justify-between p-4 md:p-5 border-b rounded-t ${
            isDark 
              ? 'border-gray-700' 
              : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h3>
            <button 
              type="button"
              className={`bg-transparent rounded-lg text-sm w-8 h-8 inline-flex items-center justify-center cursor-pointer ${
                isDark
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-400 hover:bg-gray-200 hover:text-gray-900'
              }`}
              onClick={onClose}
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
            </button>
          </div>
          <div className={`p-4 md:p-5 space-y-4 ${
            isDark ? 'text-gray-200' : 'text-gray-900'
          }`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
