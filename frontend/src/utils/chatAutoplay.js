export function triggerChatAutoplay(kind) {
  // kind: 'expenses' | 'incomes' | 'insights'
  const text = kind === 'expenses' ? 'expenses' : kind === 'incomes' ? 'incomes' : 'insights';
  window.dispatchEvent(new CustomEvent('chat:autoplay', { detail: { text } }));
}