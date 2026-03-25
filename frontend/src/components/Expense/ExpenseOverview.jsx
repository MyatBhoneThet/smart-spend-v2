import React, { useEffect, useState, useRef, useContext, useMemo } from "react";
import { LuPlus } from "react-icons/lu";
import CustomLineChart from "../Charts/CustomLineChart";
import useT from "../../hooks/useT";
import { UserContext } from "../../context/UserContext";
import moment from "moment";

const ExpenseOverview = ({ transactions = [], onAddExpense, format }) => {
  const [chartData, setChartData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [yearList, setYearList] = useState([]);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === "dark";
  const { t } = useT();

  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target))
        setMonthDropdownOpen(false);
      if (yearRef.current && !yearRef.current.contains(e.target))
        setYearDropdownOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const years = Array.from(
      new Set(transactions.map((tx) => moment(tx.date).year()))
    ).sort((a, b) => b - a);

    setYearList(years);
  }, [transactions]);

  useEffect(() => {
    if (!transactions.length) {
      setChartData([]);
      return;
    }

    let filteredTx = [...transactions];

    if (selectedMonth !== null) {
      filteredTx = filteredTx.filter(
        (tx) => moment(tx.date).month() === selectedMonth
      );
    }

    if (selectedYear !== null) {
      filteredTx = filteredTx.filter(
        (tx) => moment(tx.date).year() === selectedYear
      );
    }

    const result = filteredTx
      .map((tx) => ({
        date: moment(tx.date).format("YYYY-MM-DD"),
        amount: Number(tx.amount),
        category: tx.category || tx.categoryName || "Uncategorized",
        source: tx.source || "Expense",
      }))
      .sort((a, b) => moment(a.date) - moment(b.date));

    setChartData(result);
  }, [transactions, selectedMonth, selectedYear]);

  const totalExpense = useMemo(() => {
    return chartData.reduce((sum, tx) => sum + tx.amount, 0);
  }, [chartData]);

  const formattedTotal = useMemo(() => {
    return format(totalExpense);
  }, [format, totalExpense]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ml-4 mr-4 mt-4 mb-4">
        <div className="flex-1">
          <h1
            className={`text-xl font-bold mb-1 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {tt("expense.expenseOverview", "Expense Overview")}
          </h1>
          <p
            className={`text-sm ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {tt(
              "expense.text",
              "Track your spending trends over time and gain insights into where your money goes."
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Month */}
          <div ref={monthRef} className="relative min-w-[80px]">
            <button
              className={`w-full px-2 py-1.5 rounded-md text-xs sm:text-sm ${
                isDark
                  ? "bg-gray-700 text-white"
                  : "bg-gray-100 text-gray-800 border border-gray-300"
              }`}
              onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
            >
              {selectedMonth !== null
                ? moment().month(selectedMonth).format("MMM")
                : tt("expense.month", "Month")}
            </button>

            {monthDropdownOpen && (
              <div
                className={`absolute mt-1 rounded-md shadow-lg z-20 max-h-60 overflow-auto border ${
                  isDark
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      isDark
                        ? "hover:bg-gray-600 text-gray-100"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => {
                      setSelectedMonth(i);
                      setMonthDropdownOpen(false);
                    }}
                  >
                    {moment().month(i).format("MMMM")}
                  </div>
                ))}

                <div
                  className="px-3 py-2 cursor-pointer font-bold text-sm text-green-500 border-t"
                  onClick={() => {
                    setSelectedMonth(null);
                    setMonthDropdownOpen(false);
                  }}
                >
                  {tt("expense.all", "All")}
                </div>
              </div>
            )}
          </div>

          {/* Year */}
          <div ref={yearRef} className="relative min-w-[70px]">
            <button
              className={`w-full px-2 py-1.5 rounded-md text-xs sm:text-sm ${
                isDark
                  ? "bg-gray-700 text-white"
                  : "bg-gray-100 text-gray-800 border border-gray-300"
              }`}
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
            >
              {selectedYear || tt("expense.year", "Year")}
            </button>

            {yearDropdownOpen && (
              <div
                className={`absolute mt-1 rounded-md shadow-lg z-20 max-h-60 overflow-auto border ${
                  isDark
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {yearList.map((y) => (
                  <div
                    key={y}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      isDark
                        ? "hover:bg-gray-600 text-gray-100"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => {
                      setSelectedYear(y);
                      setYearDropdownOpen(false);
                    }}
                  >
                    {y}
                  </div>
                ))}

                <div
                  className="px-3 py-2 cursor-pointer font-bold text-sm text-green-500 border-t"
                  onClick={() => {
                    setSelectedYear(null);
                    setYearDropdownOpen(false);
                  }}
                >
                  {tt("expense.all", "All")}
                </div>
              </div>
            )}
          </div>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm"
            onClick={onAddExpense}
          >
            <LuPlus />
            {tt("expense.addExpense", "Add Expense")}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="ml-4 mr-4 mb-4">
        {chartData.length ? (
          <div
            className={`rounded-lg p-3 border ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="h-[200px]">
              <CustomLineChart data={chartData} />
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500">
            {tt(
              "expense.noData",
              "No expense data available for this period."
            )}
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center gap-2 ml-4 mt-6 mb-3">
        <span className="text-sm text-gray-500">
          {tt(
            "expense.totalExpense",
            "Total Expense for this period:"
          )}
        </span>
        <span className="text-xl font-bold text-rose-500">
          {formattedTotal}
        </span>
      </div>
    </>
  );
};

export default ExpenseOverview;
