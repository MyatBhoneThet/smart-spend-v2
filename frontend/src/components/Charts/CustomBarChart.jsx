import React, { useContext, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { UserContext } from "../../context/UserContext";
import { useCurrency } from "../../context/CurrencyContext";
import moment from "moment";

const cssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return (v || "").trim() || fallback;
};

const CustomBarChart = ({ data = [] }) => {
  const { prefs } = useContext(UserContext);
  const { format, symbol } = useCurrency();
  const isDark = prefs?.theme === "dark";

  const COLORS = useMemo(() => {
    const PRIMARY = cssVar("--color-primary", "#16A34A");
    const P500 = cssVar("--color-primary-500", "#22C55E");
    return [PRIMARY, P500, PRIMARY, P500, PRIMARY, P500, PRIMARY, P500];
  }, []);

  const gridStroke = isDark ? "#3F3F46" : cssVar("--color-primary-100", "#DCFCE7");
  const tickColor = isDark ? "#E5E7EB" : "#334155";

  const safeFormatDate = (entry) => {
    const rawDate = entry?.date || entry?.createdAt || entry?.transactionDate;
    if (!rawDate) return "";

    const parsed = moment(rawDate, [
      moment.ISO_8601,
      "YYYY-MM-DD",
      "YYYY/MM/DD",
      "DD-MM-YYYY",
      "D MMM YYYY",
      "MMM D, YYYY",
      "YYYY-MM-DDTHH:mm:ss.SSSZ",
    ]);

    return parsed.isValid() ? parsed.format("MMM D") : "";
  };

  // 🔹 Custom tooltip with transaction title/source (like expense chart)
  const CustomToolTip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0]?.payload || {};
      const transactionTitle = p.source || p.title || "Income";
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-green-400 font-semibold text-sm mb-1">
            {transactionTitle}
          </p>
          <p className="text-gray-300 text-sm">
            Amount:{" "}
            <span className="text-white font-medium">
              {format(p.amount || 0)}
            </span>
          </p>
          {p.category && p.category !== "Uncategorized" && (
            <p className="text-gray-300 text-sm mt-1">
              Category:{" "}
              <span className="text-white font-medium">{p.category}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Mobile-first responsive configuration
  const getChartConfig = () => {
    const dataLength = data.length;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    
    return {
      margin: { top: 10, right: 5, left: 0, bottom: 5 },
      xAxisHeight: 30,
      yAxisWidth: 30,
      tickFontSize: isMobile ? 9 : 10,
      barSize: isMobile ? Math.max(12, 25 - dataLength * 0.3) : 20,
      angle: dataLength > 4 ? -45 : 0,
      textAnchor: dataLength > 4 ? "end" : "middle",
      interval: dataLength > 6 ? "preserveStartEnd" : 0
    };
  };

  const chartConfig = getChartConfig();

  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      _formattedDate: safeFormatDate(d),
    }));
  }, [data]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={chartConfig.margin}
          barSize={chartConfig.barSize}
          barGap={2}
        >
          <CartesianGrid 
            stroke={gridStroke} 
            strokeDasharray="2 2" 
            vertical={false}
          />
          <XAxis
            dataKey="_formattedDate"
            tick={{ 
              fontSize: chartConfig.tickFontSize, 
              fill: tickColor,
              fontWeight: 500 
            }}
            stroke="none"
            angle={chartConfig.angle}
            textAnchor={chartConfig.textAnchor}
            height={chartConfig.xAxisHeight}
            interval={chartConfig.interval}
            tickMargin={5}
            minTickGap={1}
          />
          <YAxis 
            tick={{ 
              fontSize: chartConfig.tickFontSize, 
              fill: tickColor,
              fontWeight: 500 
            }} 
            stroke="none"
            width={chartConfig.yAxisWidth}
            tickFormatter={(value) => {
              const s = symbol();
              if (value >= 1000000) return `${s}${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${s}${(value / 1000).toFixed(0)}k`;
              return `${s}${value}`;
            }}
          />
          <Tooltip content={<CustomToolTip />} />
          <Bar 
            dataKey="amount" 
            radius={[3, 3, 0, 0]}
            animationDuration={300}
          >
            {data.map((_, i) => (
              <Cell 
                key={i} 
                fill={COLORS[i % COLORS.length]}
                stroke="none"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
