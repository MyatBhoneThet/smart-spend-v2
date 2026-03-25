import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';

const CustomTooltip = ({ active, payload }) => {
  const { prefs } = useContext(UserContext);
  const { format } = useCurrency();
  const isDark = prefs?.theme === 'dark';

  if (active && payload && payload.length) {
    return (
      <div className={`shadow-md rounded-lg p-2 border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}>
        <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-green-300' : 'text-green-800'}`}>
          {payload[0].name}
        </p>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
          Amount: <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{format(payload[0].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
