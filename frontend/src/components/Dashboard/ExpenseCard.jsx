import React, { useContext, useState } from 'react';
import { LuHandCoins, LuChevronRight } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';
import Modal from '../layouts/Modal';
import AddExpenseForm from '../Expense/AddExpenseForm';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-toastify';

const ExpenseCard = ({ thisMonthExpense, format }) => {
  const navigate = useNavigate();
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const { t } = useT();

  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);

  const tt = (key, fallback) => {
    const s = t(key);
    return s && s !== key ? s : fallback;
  };

  const handleAddExpense = async (expense) => {
    const { source, categoryId, categoryName, amount, date, icon } = expense;

    if (!source?.trim()) return toast.error(tt('expense.text1','Source is required.'));
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return toast.error(tt('expense.text2','Amount must be greater than 0.'));
    if (!date) return toast.error(tt('expense.text3','Date is required.'));

    try {
      await axiosInstance.post(API_PATHS.EXPENSE.ADD_EXPENSE, {
        source: source.trim(),
        categoryId: categoryId || undefined,
        category: categoryName || undefined,
        amount: Number(amount),
        date,
        icon: icon || '',
      });

      setOpenAddExpenseModal(false);
      toast.success(tt('expense.text4','Expense added successfully.'));
      navigate('/expense');
    } catch (error) {
      console.error(error?.response?.data || error);
      toast.error(error?.response?.data?.message || tt('expense.text5','Something went wrong.'));
    }
  };

  return (
    <div className="glass-panel p-6 group">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold tracking-wide ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
          {tt("dashboard.expense", "Expense")}
        </h2>
        <button onClick={() => navigate('/expense')} className="p-2.5 rounded-xl transition-all duration-300 bg-red-500/10 hover:bg-red-500/20 group-hover:scale-105">
          <LuHandCoins className="text-red-500" size={24} />
        </button>
      </div>

      <p className={`mt-2 text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
        <span className="text-sm font-medium text-slate-500 block mb-1">{tt("dashboard.thisMonth", "This month")}</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400"> {format(thisMonthExpense)}</span>
      </p>

      <div className="mt-8 flex gap-3">
        <button onClick={() => navigate('/expense')} className="flex-1 bg-slate-100/50 hover:bg-slate-200/60 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl transition-all duration-300">
          {tt("dashboard.viewDetail", "View")}
        </button>

        <button onClick={() => setOpenAddExpenseModal(true)} className="flex-[2] !w-auto flex items-center justify-center gap-1 font-semibold text-white p-[10px] rounded-xl transition-all duration-300 relative overflow-hidden bg-red-500 hover:bg-red-600 shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]">
          <span>{tt("dashboard.addExpense", "Add Expense")}</span>
          <LuChevronRight className="text-red-100" size={18} />
        </button>
      </div>

      <Modal isOpen={openAddExpenseModal} onClose={() => setOpenAddExpenseModal(false)} title={tt('expense.addNewExpense', 'Add New Expense')}>
        <AddExpenseForm onAddExpense={handleAddExpense} mode="add" />
      </Modal>
    </div>
  );
};

export default ExpenseCard;
