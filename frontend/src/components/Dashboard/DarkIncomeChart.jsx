import React, { useContext } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';

const CustomTooltip = ({ active, payload, isDark }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`rounded-lg border p-3 shadow-xl backdrop-blur-xl ${isDark ? 'border-white/5 bg-[#1a1b23]' : 'border-black/8 bg-white'}`}>
        <div className="flex items-center gap-2 text-sm font-bold">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
          <span className={`capitalize ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{data.name}:</span>
          <span style={{ color: data.color }}>{data.value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const DarkIncomeChart = ({ data, format }) => {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const themeGreen = isDark ? '#d9ff34' : '#84cc16';
  const COLORS = [themeGreen, '#8b5cf6', '#38bdf8', '#f59e0b', '#fb7185', '#22d3ee', '#a855f7'];

  const chartData = Array.isArray(data) && data.length > 0 ? data : [];
  const coloredData = chartData.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  const totalAmount = chartData.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalLabel = typeof format === 'function' ? format(totalAmount) : `$${totalAmount.toFixed(0)}`;
  const cardClass = isDark
    ? 'bg-[#13141C] border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
    : 'bg-white/18 border-white/22 shadow-[0_16px_40px_rgba(15,23,42,0.12)] ring-1 ring-white/30 backdrop-blur-3xl backdrop-saturate-150';

  const { t } = useT();
  const tt = (k, f) => { const v = t?.(k); return v && v !== k ? v : f; };

  return (
    <div className={`h-[260px] w-full overflow-hidden rounded-[22px] border p-5 flex flex-col relative ${cardClass}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className={`text-[12px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-gray-100' : 'text-[#11131b]'}`}>
          {tt('dashboard.incomeByCategory', 'Income by Category')}
        </h3>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>
          {tt('dashboard.byCategory', 'By category')}
        </span>
      </div>

      {coloredData.length === 0 ? (
        <div className={`flex flex-1 items-center justify-center text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>
          {tt('dashboard.noIncomeData', 'No income data')}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <div className="relative flex h-full w-1/2 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coloredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {coloredData.map((entry, index) => (
                    <Cell key={`income-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className={`rounded-full border px-2 py-1 text-lg font-black tracking-tighter shadow-sm ${isDark ? 'border-[#2a2b36] bg-[#13141C] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'border-black/8 bg-white text-[#11131b]'}`}>
                {totalLabel}
              </span>
            </div>
          </div>

          <div className={`flex max-h-[200px] w-1/2 flex-col justify-center gap-3 overflow-y-auto pl-4 scrollbar-thin ${isDark ? 'scrollbar-thumb-gray-700' : 'scrollbar-thumb-gray-300'}`}>
            {coloredData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className={`max-w-[80px] truncate text-xs font-bold capitalize tracking-wide ${isDark ? 'text-gray-400' : 'text-[#5f6476]'}`}>
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-black tracking-widest" style={{ color: item.color }}>
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DarkIncomeChart;
