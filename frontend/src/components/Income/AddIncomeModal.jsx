import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import CategorySelect from '../common/CategorySelect';

export default function AddIncomeModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ source:'', categoryId:'', categoryName:'Uncategorized', amount:'', date:'' });
  const [saving, setSaving] = useState(false);
  if (!open) return null;

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function submit() {
    if (!form.source || !form.amount || !form.date) return alert('Source, Amount and Date are required');
    setSaving(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.INCOME.ADD_INCOME, form);
      onSaved?.(data);
      onClose?.();
      setForm({ source:'', categoryId:'', categoryName:'Uncategorized', amount:'', date:'' });
    } catch (e) { alert(e?.response?.data?.message || 'Error'); }
    setSaving(false);
  }

  return (
    <div className="modal" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Income</h3>
        </div>

        <div className="modal-body space-y-4">
          <div>
            <label className="lbl">Income Source</label>
            <input className="input" placeholder="Salary, Freelance, Bonus…" value={form.source}
                   onChange={(e) => setField('source', e.target.value)} />
          </div>

          <div>
            <label className="lbl">Category</label>
            <CategorySelect
              type="income"
              value={form.categoryId}
              onChange={(id, name) => setForm((p) => ({ ...p, categoryId: id, categoryName: name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lbl">Amount</label>
              <input className="input" type="number" value={form.amount}
                     onChange={(e)=>setField('amount', e.target.value)} />
            </div>
            <div>
              <label className="lbl">Date</label>
              <input className="input" type="date" value={form.date}
                     onChange={(e)=>setField('date', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Add Income'}</button>
        </div>
      </div>
    </div>
  );
}
