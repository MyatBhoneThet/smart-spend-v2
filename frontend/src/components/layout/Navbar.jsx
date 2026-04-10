import React, { useState, useContext } from 'react';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import SideMenu from './SideMenu';
import { UserContext } from '../../context/UserContext'; // Adjust path as needed

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const { prefs } = useContext(UserContext);
  
  // Check if dark theme is enabled
  const isDarkTheme = prefs?.theme === 'dark';

  return (
    <div className={`flex gap-5 border border-b backdrop-blur-[2px] px-7 sticky top-0 z-50 ${
      isDarkTheme 
        ? 'bg-gray-900 border-gray-700/50 text-white' 
        : 'bg-white border-gray-200/50 text-black'
    }`}>
      <button
        className={`block lg:hidden ${isDarkTheme ? 'text-white' : 'text-black'}`}
        onClick={() => {
          setOpenSideMenu(!openSideMenu);
        }}
      >
        {openSideMenu ? (
          <HiOutlineX className='text-2xl' />
        ) : (
          <HiOutlineMenu className='text-2xl' />
        )}
      </button>
      
      <h2 className={`text-lg font-medium ${isDarkTheme ? 'text-white' : 'text-black'}`}>
        Smart Spend
      </h2>
      
      {openSideMenu && (
        <div className={`fixed top-[61px] -ml-4 ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>
          <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </div>
  );
};

export default Navbar;
