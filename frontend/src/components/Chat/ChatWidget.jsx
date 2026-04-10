import { useEffect, useRef, useState, useContext } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LuMessageCircle, LuSend, LuSparkles, LuX } from 'react-icons/lu';
import MicButton from '../../components/Voice/MicButton';

export default function ChatWidget({ side = 'left' }) {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const { format } = useCurrency();

  const btnPos = side === 'right' ? 'right-6' : 'left-6';
  const panelPos = side === 'right' ? 'right-6' : 'left-6';
  const Z_STACK = 'z-[9999]';

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Ask about totals, income, or expenses.\nExamples:\n• How much did I spend today?\n• How much did I get this month?\n• Show my last 30 days insights.",
    },
  ]);

  const [range, setRange] = useState('30d');
  const [lastKind, setLastKind] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const rangePretty = (k) => (k === '2m' ? 'Last 2 months' : 'Last 30 days');

  const toISODate = (d) => d.toISOString().slice(0, 10);
  function getDates(k) {
    const now = new Date();
    const endDate = toISODate(now);
    const start = new Date(now);
    if (k === '2m') {
      const day = start.getDate();
      start.setMonth(start.getMonth() - 2);
      if (start.getDate() !== day) start.setDate(1);
    } else {
      start.setDate(start.getDate() - 29);
    }
    return { startDate: toISODate(start), endDate };
  }

  async function handleSend(forcedText) {
    const userText = (forcedText ?? text).trim();
    if (!userText) return;

    const next = [...messages, { role: 'user', content: userText }];
    setMessages(next);
    setText('');
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(
        API_PATHS.CHAT.SEND,
        { messages: next },
        { timeout: 60000 }
      );

      const payload = data?.reply;
      if (payload?.totals) {
        const where = payload?.range?.label ? ` (${payload.range.label})` : '';
        const { expenseTHB, incomeTHB, netTHB } = payload.totals;

        let reply;
        if (payload.intent === 'expense') {
          reply = `You spent ${format(expenseTHB)}${where}.`;
        } else if (payload.intent === 'income') {
          reply = `You received ${format(incomeTHB)}${where}.`;
        } else {
          reply = [
            `Totals${where}:`,
            `• Income: ${format(incomeTHB)}`,
            `• Expenses: ${format(expenseTHB)}`,
            `• Net: ${format(netTHB)}`,
          ].join('\n');
        }

        setMessages((cur) => [...cur, { role: 'assistant', content: reply }]);
      } else {
        const replyText = data?.reply?.content || 'Sorry, no reply.';
        setMessages((cur) => [...cur, { role: 'assistant', content: replyText }]);
      }
    } catch (err) {
      const status = err?.response?.status;
      let msg = 'Chat request failed.';
      if (status === 401) msg = 'Please log in again to use chat.';
      if (status === 404) msg = 'Chat route not found on the server.';
      if (status === 500) msg = 'Server error. Check server logs.';
      setMessages((cur) => [...cur, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    handleSend();
  }

  async function fetchTotal(kind, kRange) {
    const { startDate, endDate } = getDates(kRange);
    try {
      setLoading(true);

      if (kind === 'insights') {
        const [incRes, expRes] = await Promise.all([
          axiosInstance.get(API_PATHS.TRANSACTIONS.ANALYTICS_SUM, { params: { type: 'income', startDate, endDate } }),
          axiosInstance.get(API_PATHS.TRANSACTIONS.ANALYTICS_SUM, { params: { type: 'expense', startDate, endDate } }),
        ]);

        const income = incRes?.data?.total ?? 0;
        const expense = expRes?.data?.total ?? 0;
        const net = income - expense;

        const lines = [
          `${rangePretty(kRange)} • Insights`,
          `• Incomes: ${format(income)}`,
          `• Expenses: ${format(expense)}`,
          `• Net: ${format(net)}`,
        ].join('\n');

        setMessages((cur) => [
          ...cur,
          { role: 'user', content: `${kind} — ${rangePretty(kRange)}` },
          { role: 'assistant', content: lines },
        ]);
        return;
      }

      const typeParam = kind === 'expenses' ? 'expense' : 'income';
      const res = await axiosInstance.get(API_PATHS.TRANSACTIONS.ANALYTICS_SUM, {
        params: { type: typeParam, startDate, endDate },
      });
      const total = res?.data?.total ?? 0;

      const title = kind === 'expenses'
        ? `${rangePretty(kRange)} • Expenses`
        : `${rangePretty(kRange)} • Incomes`;

      setMessages((cur) => [
        ...cur,
        { role: 'user', content: `${kind} — ${rangePretty(kRange)}` },
        { role: 'assistant', content: `${title} = ${format(total)}` },
      ]);
    } catch {
      setMessages((cur) => [
        ...cur,
        { role: 'assistant', content: 'Unable to fetch totals. Check the analytics endpoint.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function quickAsk(kind) {
    setLastKind(kind);
    if (!open) setOpen(true);
    fetchTotal(kind, range);
  }

  useEffect(() => {
    if (lastKind) fetchTotal(lastKind, range);
  }, [range]);

  const surface = isDark
    ? 'bg-[#11131b] border-white/10 text-white'
    : 'bg-[#fffdf7] border-black/8 text-gray-900 shadow-[0_18px_60px_rgba(15,23,42,0.08)]';
  const launcherClass = isDark
    ? 'bg-[#d9ff34] text-black shadow-[0_0_24px_rgba(217,255,52,0.28)] hover:bg-[#c8ef1b]'
    : 'bg-[#11131b] text-[#84cc16] shadow-[0_10px_30px_rgba(15,23,42,0.15)] hover:bg-[#1f2937]';
  const assistantBubble = isDark
    ? 'border border-white/10 bg-white/[0.03] text-white'
    : 'border border-black/8 bg-white text-gray-800';
  const userBubble = isDark
    ? 'bg-[#d9ff34] text-black'
    : 'bg-[#84cc16] text-white';

  const muted = isDark ? 'text-[#7b8095]' : 'text-gray-500';

  return (
    <>
      <div className={`fixed bottom-6 ${btnPos} ${Z_STACK} flex items-center gap-3`}>
        <button
          className={`grid h-14 w-14 place-items-center rounded-full transition-colors ${launcherClass}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle chat"
        >
          {open ? <LuX size={24} /> : <LuMessageCircle size={26} />}
        </button>
        {!open && (
          <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${surface}`}>
            Smart Spend Assistant
          </div>
        )}
      </div>

      {open && (
        <div
          className={`fixed bottom-24 ${panelPos} ${Z_STACK} flex w-[420px] max-h-[82vh] flex-col rounded-[28px] border shadow-[0_18px_60px_rgba(0,0,0,0.45)] ${surface}`}
        >
          <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-white/10' : 'border-black/8'}`}>
            <div>
              <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] ${isDark ? 'text-[#7b8095]' : 'text-[#6b7080]'}`}>
                <LuSparkles className={isDark ? "text-[#d9ff34]" : "text-[#84cc16]"} />
                Smart Spend
              </div>
              <div className={`mt-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Financial assistant</div>
            </div>
            <button
              className={`rounded-xl border p-2 ${isDark ? 'border-white/10 text-[#d0d3e4] hover:bg-white/[0.05]' : 'border-black/8 text-gray-700 hover:bg-black/[0.04]'}`}
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <LuX />
            </button>
          </div>

          <div className={`border-b px-4 py-3 ${isDark ? 'border-white/10' : 'border-black/8'}`}>
            <div className="flex items-center gap-2">
              {['30d', '2m'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${
                    range === r
                      ? isDark
                        ? 'border-[#d9ff34]/20 bg-[#d9ff34]/10 text-[#d9ff34]'
                        : 'border-[#11131b]/10 bg-[#11131b] text-[#84cc16]'
                      : isDark
                      ? 'border-white/10 bg-white/[0.03] text-[#d0d3e4] hover:bg-white/[0.05]'
                      : 'border-black/8 bg-white text-gray-700 hover:bg-black/[0.03]'
                  }`}
                  aria-pressed={range === r}
                >
                  {rangePretty(r)}
                </button>
              ))}
            </div>
            <div className={`mt-3 text-[11px] uppercase tracking-[0.16em] ${muted}`}>
              Quick totals
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {['expenses', 'incomes', 'insights'].map((kind) => (
                <button
                  key={kind}
                  onClick={() => quickAsk(kind)}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${
                    isDark
                      ? 'border-white/10 bg-white/[0.03] text-[#d0d3e4] hover:bg-white/[0.05]'
                      : 'border-black/8 bg-white text-gray-700 hover:bg-black/[0.03]'
                  }`}
                >
                  {kind.charAt(0).toUpperCase() + kind.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm">
            {messages.map((m, i) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div key={i} className={isAssistant ? 'text-left' : 'text-right'}>
                  <div
                    className={`inline-block max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 ${
                      isAssistant
                        ? assistantBubble
                        : userBubble
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            {loading && <div className={`text-xs ${muted}`}>Working…</div>}
          </div>

          <form onSubmit={onSubmit} className={`border-t p-3 ${isDark ? 'border-white/10' : 'border-black/8'}`}>
            <div className={`flex items-center gap-2 rounded-[22px] px-3 py-2 ${isDark ? 'border border-white/10 bg-white/[0.03]' : 'border border-black/8 bg-white'} `}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Ask: "How much did I spend today?"'
                className={`flex-1 bg-transparent text-sm outline-none placeholder:text-[#6c7086] ${isDark ? 'text-white' : 'text-gray-900'}`}
              />

              <MicButton
                lang="en-US"
                onFinal={(speech) => {
                  setText(speech);
                  setTimeout(() => handleSend(), 0);
                }}
                className={isDark ? 'border-white/10 text-[#d0d3e4]' : 'border-black/8 text-gray-700'}
              />

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className={`grid h-10 w-10 place-items-center rounded-xl transition-all disabled:opacity-40 ${isDark ? 'bg-[#d9ff34] text-black' : 'bg-[#11131b] text-[#84cc16]'}`}
                aria-label="Send"
              >
                <LuSend />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
