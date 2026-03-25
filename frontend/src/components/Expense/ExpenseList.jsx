import React, { useEffect, useContext } from 'react';
import moment from 'moment';
import { LuDownload } from 'react-icons/lu';
import TransactionInfoCard from '../Cards/TransactionInfoCard';
import useT from '../../hooks/useT';
import { UserContext } from '../../context/UserContext';

function titleFrom(tx) {
    const category = tx.categoryName || tx.category || 'Uncategorized';
    const src = (tx.source || '').trim();
    return src ? `${src} (${category})` : category;
}

const ExpenseList = ({ transactions = [], onDelete, onDownload, onEdit }) => {
    const { t, lang } = useT();
    const tt = (key, fallback) => {
        const val = t?.(key);
        return val && val !== key ? val : fallback;
    };
    const { prefs } = useContext(UserContext);
    const isDark = prefs?.theme === 'dark';
    useEffect(() => {}, [lang]);

    const headerAndDownloadClass = 'flex items-center justify-between ml-4 mr-4 mt-4 mb-4';
    const buttonClass = 'card-btn';
    const emptyClass = 'text-slate-500 text-sm py-3';

    return (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200/50 text-gray-900'}`}>
            <div className={headerAndDownloadClass}>
                <h5 className="text-lg font-semibold">
                    {tt('expense.expenseSources', 'Expense Sources')}
                </h5>
                <button className={buttonClass} onClick={onDownload}>
                    <LuDownload className="text-base" /> {tt('expense.download', 'Download')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4 mr-4">
                {transactions.map((expense) => (
                    <TransactionInfoCard
                        key={expense._id}
                        title={titleFrom(expense)}
                        icon={expense.icon}
                        date={expense.date ? moment(expense.date).format('Do MMM YYYY') : ''}
                        amount={Number(expense.amount)}   // raw number
                        type="expense"
                        onDelete={() => onDelete?.(expense._id)}
                        onEdit={() => onEdit?.(expense)}
                    />
                ))}
                {transactions.length === 0 &&
                    <div className={emptyClass}>
                        {tt("expense.noData", "No expense data available yet")}
                    </div>
                }
            </div>
        </div>
    );
};

export default ExpenseList;
