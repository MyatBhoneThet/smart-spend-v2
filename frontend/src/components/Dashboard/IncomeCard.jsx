import React, { useContext, useState } from 'react';
import { LuWalletMinimal, LuChevronRight } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';
import Modal from '../layouts/Modal';
import AddIncomeForm from '../Income/AddIncomeForm';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-toastify';

const IncomeCard = ({ thisMonthIncome, format }) => {
  const navigate = useNavigate();
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const { t } = useT();

  const [openAddIncomeModal, setOpenAddIncomeModal] = useState(false);

  const tt = (key, fallback) => {
    const s = t(key);
    return s && s !== key ? s : fallback;
  };

  const handleAddIncome = async (income) => {
    const { source, categoryId, categoryName, amount, date, icon } = income;

    if (!source?.trim()) return toast.error(tt('income.text1','Source is required.'));
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return toast.error(tt('income.text2','Amount must be greater than 0.'));
    if (!date) return toast.error(tt('income.text3','Date is required.'));

    try {
      await axiosInstance.post(API_PATHS.INCOME.ADD_INCOME, {
        source: source.trim(),
        categoryId: categoryId || undefined,
        category: categoryName || undefined,
        amount: Number(amount),
        date,
        icon: icon || '',
      });

      setOpenAddIncomeModal(false);
      toast.success(tt('income.text4','Income added successfully.'));
      navigate('/income');
    } catch (error) {
      console.error(error?.response?.data || error);
      toast.error(error?.response?.data?.message || tt('income.text5','Something went wrong.'));
    }
  };

  return (
    <div className="glass-panel p-6 group">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold tracking-wide ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
          {tt("dashboard.income", "Income")}
        </h2>
        <button onClick={() => navigate('/income')} className="p-2.5 rounded-xl transition-all duration-300 bg-green-500/10 hover:bg-green-500/20 group-hover:scale-105">
          <LuWalletMinimal className="text-green-500" size={24} />
        </button>
      </div>

      <p className={`mt-2 text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
        <span className="text-sm font-medium text-slate-500 block mb-1">{tt("dashboard.thisMonth", "This month")}</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-400"> {format(thisMonthIncome)}</span>
      </p>

      <div className="mt-8 flex gap-3">
        <button onClick={() => navigate('/income')} className="flex-1 bg-slate-100/50 hover:bg-slate-200/60 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl transition-all duration-300">
          {tt("dashboard.viewDetail", "View")}
        </button>

        <button onClick={() => setOpenAddIncomeModal(true)} className="flex-[2] btn-primary !my-0 !w-auto flex items-center justify-center gap-1 shadow-green-500/20">
          <span>{tt("dashboard.addIncome", "Add Income")}</span>
          <LuChevronRight className="text-green-100" size={18} />
        </button>
      </div>

      <Modal isOpen={openAddIncomeModal} onClose={() => setOpenAddIncomeModal(false)} title={tt('income.addNewIncome', 'Add New Income')}>
        <AddIncomeForm onAddIncome={handleAddIncome} mode="add" />
      </Modal>
    </div>
  );
};

export default IncomeCard;
