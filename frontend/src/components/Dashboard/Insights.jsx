import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

export default function Insights() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [totals, setTotals] = useState({ incomes: 0, expenses: 0, balance: 0 });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA, { timeout: 15000 });
        const totalIncomes = Number(data?.totalIncome || 0);
        const totalExpenses = Number(data?.totalExpenses || 0);
        const balance = totalIncomes - totalExpenses;
        setTotals({ incomes: totalIncomes, expenses: totalExpenses, balance });
      } catch (e) {
        setErr(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="card">Loading insights…</div>;
  if (err) return <div className="card text-red-600">{String(err)}</div>;

  const fmt = (n) => 'THB ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="card">
        <div className="text-xs text-gray-500">Total Balance</div>
        <div className="text-2xl font-semibold">{fmt(totals.balance)}</div>
      </div>
      <div className="card">
        <div className="text-xs text-gray-500">Total Incomes</div>
        <div className="text-2xl font-semibold">{fmt(totals.incomes)}</div>
      </div>
      <div className="card">
        <div className="text-xs text-gray-500">Total Expenses</div>
        <div className="text-2xl font-semibold">{fmt(totals.expenses)}</div>
      </div>
    </div>
  );
}