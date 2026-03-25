import React from 'react';
const EMOJIS = ['🍔','🍜','🍕','🧋','☕️','🚌','🚕','🚇','🚲','🏠','🛒','💼','🏢','🎁','💡','💳'];

export default function IconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EMOJIS.map(e => (
        <button type="button" key={e}
          onClick={()=>onChange && onChange(e)}
          className={`emoji ${value===e ? 'emoji-active': ''}`}>{e}</button>
      ))}
    </div>
  );
}