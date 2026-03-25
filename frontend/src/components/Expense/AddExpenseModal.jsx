import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import CategorySelect from '../common/CategorySelect';

export default function AddExpenseModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ source:'', categoryId:'', amount:'', date:'' });
  const [saving, setSaving] = useState(false);
  if (!open) return null;

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function submit() {
    if (!form.amount || !form.date) return alert('Amount and Date are required');
    setSaving(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.EXPENSE.ADD_EXPENSE, form);
      onSaved && onSaved(data);
      onClose && onClose();
      setForm({ source:'', categoryId:'', amount:'', date:'' });
    } catch (e) { alert(e?.response?.data?.message || 'Error'); }
    setSaving(false);
  }

  return (
    <div className="modal" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Expense</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="modal-body">
          <label>Expense Source (e.g., KFC/McD/Starbucks)</label>
          <input className="input" placeholder="KFC" value={form.source}
                 onChange={e=>setField('source', e.target.value)} />

          <div style={{marginTop:12}}>
            <label>Category</label>
            <CategorySelect type="expense" value={form.categoryId} onChange={v=>setField('categoryId', v)} />
          </div>

          <div className="grid-2" style={{marginTop:12}}>
            <div>
              <label>Amount</label>
              <input className="input" type="number" placeholder="0.00"
                     value={form.amount} onChange={e=>setField('amount', e.target.value)} />
            </div>
            <div>
              <label>Date</label>
              <input className="input" type="date" value={form.date}
                     onChange={e=>setField('date', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={saving} onClick={submit}>{saving?'Saving…':'Add Expense'}</button>
        </div>
      </div>
    </div>
  );
}
