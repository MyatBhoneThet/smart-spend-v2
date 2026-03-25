import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const CustomLegend = ({ payload = [] }) => {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';

  return (
    <div className="overflow-x-auto w-full mt-2"> {/* moved legend down */}
      <div className="flex items-center space-x-2 min-w-max">
        {payload.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center space-x-1"
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span
              className={`text-[9px] font-medium ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomLegend;
