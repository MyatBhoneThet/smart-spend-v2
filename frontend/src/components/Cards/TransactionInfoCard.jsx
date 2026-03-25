import React, { useContext } from 'react';
import { LuUtensils, LuTrendingUp, LuTrendingDown, LuTrash2, LuPencilLine } from 'react-icons/lu';
import { UserContext } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';

const TransactionInfoCard = ({
  title,
  icon,
  date,
  amount = 0,
  type,          // 'income' | 'expense'
  hideDeleteBtn,
  onDelete,
  onEdit,
}) => {
  const { prefs } = useContext(UserContext) || {};
  const isDark = (prefs?.theme || 'light') === 'dark';
  const { format } = useCurrency();

  const renderIcon = () => {
    if (!icon) return <LuUtensils />;
    if (typeof icon === 'string') return <img src={icon} alt="icon" className="w-6 h-6 object-contain" />;
    return icon;
  };

  const sign = type === 'income' ? '+' : '-';
  const formattedAmount = format(Number(amount || 0)); // currency symbol handled by format()

  const getAmountStyles = () =>
    type === 'income'
      ? (isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-600')
      : (isDark ? 'bg-rose-900/30 text-rose-300' : 'bg-rose-50 text-rose-600');

  return (
    <div className={`group relative flex items-center gap-4 mt-2 p-4 rounded-lg shadow-md border transition-shadow duration-300
      ${isDark ? 'bg-gray-800 border-gray-700/50 hover:bg-gray-700 text-gray-200' : 'bg-white border-gray-200/50 hover:bg-gray-50 text-gray-900'}`}
    >
      {/* Left icon */}
      <div className={`w-12 h-12 flex items-center justify-center text-xl rounded-full drop-shadow-lg
        ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
        {renderIcon()}
      </div>

      {/* Center text container */}
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <div className="min-w-0">
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium truncate`}>{title}</p>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-400'} text-xs mt-1 truncate`}>{date}</p>
        </div>

        {/* Right amount + buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {typeof onEdit === 'function' && (
            <button
              type="button"
              className={`hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer
                ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
              title="Edit"
              onClick={onEdit}
            >
              <LuPencilLine size={18} />
            </button>
          )}

          {!hideDeleteBtn && (
            <button
              type="button"
              className={`hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer
                ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
              onClick={onDelete}
              title="Delete"
            >
              <LuTrash2 size={18} />
            </button>
          )}

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${getAmountStyles()}`}>
            <h6 className="text-xs font-medium truncate">
              {sign}{formattedAmount}
            </h6>
            {type === 'income' ? <LuTrendingUp /> : <LuTrendingDown />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionInfoCard;
