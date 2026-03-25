import React from 'react';
import { triggerChatAutoplay } from '../../utils/chatAutoplay';

export default function AutoPlayButtons() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button onClick={() => triggerChatAutoplay('expenses')} className="btn">Expenses</button>
      <button onClick={() => triggerChatAutoplay('incomes')} className="btn">Incomes</button>
      <button onClick={() => triggerChatAutoplay('insights')} className="btn">Insights</button>
    </div>
  );
}