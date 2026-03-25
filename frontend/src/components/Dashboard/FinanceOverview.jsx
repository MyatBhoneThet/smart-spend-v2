import React, { useContext } from 'react';
import CustomPieChart from '../../components/Charts/CustomPieChart';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';
import { useCurrency } from '../../context/CurrencyContext';

const COLORS = ["#875CF5", "#FA2C37", "#FF6900"];

const FinanceOverview = ({ totalBalance, totalExpense, totalIncome }) => {
  const { prefs } = useContext(UserContext);
  const { format } = useCurrency();
  const { t } = useT();
  const isDark = prefs?.theme === 'dark';

  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const balanceData = [
    { name: tt('dashboard.totalBalance', 'Total Balance'), amount: totalBalance },
    { name: tt('dashboard.totalExpenses', 'Total Expenses'), amount: totalExpense },
    { name: tt('dashboard.totalIncome', 'Total Income'), amount: totalIncome },
  ];

  const hasData =
    (totalBalance ?? 0) > 0 ||
    (totalExpense ?? 0) > 0 ||
    (totalIncome ?? 0) > 0;

  return (
    <div
      className={`rounded-xl p-4 border shadow-sm ${
        isDark
          ? 'bg-gray-900 border-gray-700 text-gray-200'
          : 'bg-white border-gray-200/50 text-gray-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-semibold">
          {tt('dashboard.financialOverview', 'Financial Overview')}
        </h5>
      </div>

      {hasData ? (
        <CustomPieChart
          data={balanceData.map((item) => ({
            ...item,
            name: `${item.name} (${format(item.amount)})`,
          }))}
          colors={COLORS}
          label="Total Balance"
          totalAmount={format(totalBalance)}
          showTextAnchor={true}
          centerTextClass="text-slate-900 dark:text-white"
          labelClassName="text-gray-500 dark:text-gray-400"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
  <div
    className={`text-center ${
      isDark ? 'text-gray-400' : 'text-gray-500'
    }`}
  >
    <div className="mb-3">
      <svg
        className={`w-12 h-12 mx-auto ${
          isDark ? 'text-gray-500' : 'text-gray-400'
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
      {tt('dashboard.noFinanceData', 'No financial data available.')}
    </p>
  </div>
</div>
      )}
    </div>
  );
};

export default FinanceOverview;
