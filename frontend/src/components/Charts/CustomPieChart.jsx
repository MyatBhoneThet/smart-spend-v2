import React, { useContext, useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip, Label } from 'recharts';
import CustomTooltip from './CustomTooltip';
import CustomLegend from './CustomLegend';
import { UserContext } from '../../context/UserContext';

const cssVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return (v || '').trim() || fallback;
};

const CustomPieChart = ({ data = [], label, colors, totalAmount }) => {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';

  const palette = useMemo(() => {
    if (Array.isArray(colors) && colors.length) return colors;
    const P600 = cssVar('--color-primary', '#16A34A');
    const P500 = cssVar('--color-primary-500', '#22C55E');
    const P200 = cssVar('--color-primary-200', '#BBF7D0');
    const P100 = cssVar('--color-primary-100', '#DCFCE7');
    const P400 = '#34D399';
    return [P600, P500, P400, P200, P100];
  }, [colors]);

  const centerLabelColor = isDark ? '#9CA3AF' : '#64748B';
  const centerValueColor = isDark ? '#FFFFFF' : '#0F172A';
  const containerBg = isDark ? 'bg-gray-900' : 'bg-white';
  const tooltipShell = isDark ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300';

  return (
    <div className={`${containerBg} p-2 rounded-lg relative -mt-1`}>
      {/* Use negative margin to lift chart */}
      <ResponsiveContainer width="100%" height={265}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={90}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}

            <Label value={label} position="center" fill={centerLabelColor} fontSize={14} dy={-20} />
            <Label value={totalAmount} position="center" fill={centerValueColor} fontSize={24} fontWeight={600} dy={10} />
          </Pie>

          <Tooltip
            content={(props) => (
              <div className={`shadow-md rounded-lg p-2 border ${tooltipShell}`}>
                <CustomTooltip {...props} />
              </div>
            )}
          />
          <Legend content={(props) => <CustomLegend {...props} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;
