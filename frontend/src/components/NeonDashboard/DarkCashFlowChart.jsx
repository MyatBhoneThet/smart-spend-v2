import React, { useContext } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { UserContext } from '../../context/UserContext';

const CustomTooltip = ({ active, payload, label, valueFormatter, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`rounded-lg border p-3 shadow-xl backdrop-blur-xl ${isDark ? 'border-white/5 bg-[#1a1b23]' : 'border-black/8 bg-white'}`}>
        <p className={`mb-2 text-xs font-black uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-[#6b7080]'}`}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-bold mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className={`capitalize ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{entry.name}:</span>
            <span style={{ color: entry.color }}>{valueFormatter(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DarkCashFlowChart = ({
  data,
  valueFormatter = (value) => `$${Number(value || 0).toFixed(0)}`,
  yTickFormatter = (value) => value,
}) => {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const chartData = Array.isArray(data) && data.length > 0 ? data : [];
  const cardClass = isDark
    ? 'bg-[#13141C] border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
    : 'bg-[rgba(255,253,247,0.96)] border-black/8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]';

  return (
    <div className={`h-[400px] w-full overflow-hidden rounded-[24px] border p-6 flex flex-col relative ${cardClass}`}>
      <div className="flex justify-between items-center mb-6 z-10">
        <h3 className={`text-[13px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-gray-100' : 'text-[#11131b]'}`}>Cash Flow</h3>
        <div className="flex gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#a3e635] shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
            <span className={`tracking-wider uppercase ${isDark ? 'text-gray-400' : 'text-[#6b7080]'}`}>Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#fb7185] shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
            <span className={`tracking-wider uppercase ${isDark ? 'text-gray-400' : 'text-[#6b7080]'}`}>Expense</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className={`flex flex-1 items-center justify-center text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>
          No transaction data
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0 z-10 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(17,19,27,0.10)'} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6b7280' : '#6b7080', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6b7280' : '#6b7080', fontSize: 10, fontWeight: 700 }} tickFormatter={yTickFormatter} />
              <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} isDark={isDark} />} cursor={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(17,19,27,0.14)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="expense" stroke="#fb7185" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, fill: '#fb7185', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="income" stroke="#a3e635" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, fill: '#a3e635', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DarkCashFlowChart;
