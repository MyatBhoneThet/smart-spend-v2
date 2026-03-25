import React, { useEffect } from "react";
import { LuArrowRight } from "react-icons/lu";
import moment from "moment";
import TransactionInfoCard from "../Cards/TransactionInfoCard";
import useT from "../../hooks/useT";

const RecentTransactions = ({ transactions, onSeeMore, isDark }) => {
  const { t, lang } = useT();

  // translate with safe fallback
  const tt = (key, fallback) => {
    const s = t(key);
    return s && s !== key ? s : fallback;
  };

  // localize moment
  useEffect(() => {
    try {
      moment.locale(lang || "en");
    } catch {
      moment.locale("en");
    }
  }, [lang]);

  const hasTransactions = transactions && transactions.length > 0;

  return (
    <div className="card flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-semibold">
          {tt("dashboard.recentTransactions", "Recent Transactions")}
        </h5>

        <button className="card-btn" onClick={onSeeMore}>
          {tt("dashboard.seeMore", "See More")}{" "}
          <LuArrowRight className="text-base" />
        </button>
      </div>

      <div className="mt-4 flex-1">
        {hasTransactions ? (
          transactions.slice(0, 3).map((item) => (
            <TransactionInfoCard
              key={item._id}
              title={item.type === "expense" ? item.category : item.source}
              icon={item.icon}
              date={moment(item.date).format("Do MMM YYYY")}
              amount={item.amount}
              type={item.type}
              hideDeleteBtn
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div
              className={`text-center ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <div className="mb-3">
                {/* history clock icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-12 h-12 mx-auto ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    >                   
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-9-9 9 9 0 019 9zM12 3v3m0 12v3m9-9h-3M6 12H3"
                    />
                </svg>
              </div>
              <p className="text-sm">
                {tt("dashboard.noRecentHistory", "No recent history yet.")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
