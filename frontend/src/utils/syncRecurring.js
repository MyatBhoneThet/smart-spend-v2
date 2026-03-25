// src/utils/syncRecurring.js
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import { toast } from 'react-toastify';

/**
 * Sync recurring rules -> materialize into Income/Expense.
 * @param {object} opts
 * @param {boolean} opts.silent - don't toast unless something was created
 * @param {boolean} opts.showZero - if false, don't toast when nothing created
 * @returns {{createdIncome:number, createdExpense:number, createdTx:number, total:number}}
 */
export async function syncRecurring({ silent = true, showZero = false } = {}) {
  try {
    const { data } = await axiosInstance.post(`${API_PATHS.RECURRING.BASE}/run`);
    const createdIncome = data?.createdIncome || 0;
    const createdExpense = data?.createdExpense || 0;
    const createdTx = data?.createdTx || 0;
    const total = createdIncome + createdExpense;

    if (!silent && (showZero || total > 0)) {
      const msg = total > 0
        ? `Recurring: created ${total} item${total === 1 ? '' : 's'}`
        : 'Recurring: no new items to create';
      toast.success(msg);
    }
    return { createdIncome, createdExpense, createdTx, total };
  } catch (e) {
    if (!silent) toast.error('Failed to sync recurring.');
    return { createdIncome: 0, createdExpense: 0, createdTx: 0, total: 0 };
  }
}
