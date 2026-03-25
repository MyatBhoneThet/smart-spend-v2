import React, { useEffect, useState } from "react";
import { prepareExpenseBarChartData } from "../../utils/helper";
import CustomBarChart from "../Charts/CustomBarChart";
import useT from "../../hooks/useT";
import moment from "moment";

const Last30DaysExpenses = ({ date, isDark }) => {
  const [chartData, setChartData] = useState([]);
  const { t } = useT();

  const tt = (key, fallback) => {
    const s = t(key);
    return s && s !== key ? s : fallback;
  };

  useEffect(() => {
    const result = prepareExpenseBarChartData(date);

    if (Array.isArray(result)) {
      const formatted = result
        .map((item) => ({
          ...item,
          // format date consistently so CustomBarChart picks up "MMM D"
          date: item.date ? moment(item.date).toISOString() : null,

          amount: item.amount || 0,
          category: item.category || "Uncategorized",
          source: item.source || "Expense",
        }))
        .sort((a, b) => moment(a.date) - moment(b.date));
      setChartData(formatted);
    } else {
      setChartData([]);
    }
  }, [date]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="card flex items-center justify-center h-48">
        <div className={`text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          <div className="mb-3">
            <svg
              className={`w-12 h-12 mx-auto ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm">
            {tt("dashboard.noFinanceData", "No financial data available.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card col-span-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg">
          {tt("dashboard.last30DaysExpenses", "Last 30 Days Expenses")}
        </h5>
      </div>

      <div className="flex justify-center">
        <div style={{ width: "90%", maxWidth: 500, height: 250 }}>
          <CustomBarChart data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default Last30DaysExpenses;
