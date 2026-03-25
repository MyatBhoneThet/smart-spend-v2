import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';

export default function CategorySelect({
  type,                 // "expense" | "income"
  value,                // selected category id
  onChange,             // (id, name) => void
  allowCreate = true,
  isDark = false,       // NEW
  className = '',       // NEW (extra classes from parent if needed)
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');

  const listUrl = `/api/v1/categories?type=${type}`;
  const createUrl = `/api/v1/categories`;

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(listUrl);
        if (ok) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Load categories failed:', e?.response?.data || e.message);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [listUrl]);

  async function createCategory(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      const { data } = await axiosInstance.post(createUrl, { type, name });
      setItems(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)));
      onChange?.(data._id, data.name);
      setNewName('');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Create category failed';
      alert(msg);
      console.error('Create category failed:', e);
    }
  }

  // Tailwind utility sets for dark/light
  const inputBase = 'rounded-md border-2 text-sm px-3 py-2 w-full transition-colors duration-150 focus:outline-none';
  const lightInput = 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-emerald-500';
  const darkInput  = 'bg-gray-900/60 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500';

  const selectCls = [
    inputBase,
    isDark ? darkInput : lightInput,
    className,                      // allow parent to extend/override
  ].join(' ');

  const createInputCls = [
    inputBase,
    'flex-1',
    isDark ? darkInput : lightInput,
  ].join(' ');

  const addBtnCls = [
    'add-btn add-btn-fill',
    isDark ? 'text-white' : '',
  ].join(' ');

  if (loading) {
    return (
      <div className={[inputBase, isDark ? darkInput : lightInput, 'opacity-70'].join(' ')}>
        Loading categories…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        className={selectCls}
        value={value || ''}
        onChange={(e) => {
          const id   = e.target.value || '';
          const name = id ? (items.find(c => c._id === id)?.name || 'Uncategorized') : 'Uncategorized';
          onChange?.(id, name);
        }}
      >
        <option value="">Uncategorized</option>
        {items.map(c => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {allowCreate && (
        <form onSubmit={createCategory} className="flex gap-2">
          <input
            className={createInputCls}
            placeholder={`Add ${type} category (e.g. Salary, Food)`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className={addBtnCls} type="submit">Add</button>
        </form>
      )}
    </div>
  );
}
