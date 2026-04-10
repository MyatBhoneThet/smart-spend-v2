const Goal = require("../models/Goal");
const RecurringRule = require("../models/RecurringRule");
const { buildUserQuery } = require("../utils/userQuery");
const {
  loadIncomeHistory,
  loadExpenseHistory,
  groupExpensesByCategory,
} = require("../utils/historyQueries");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'M' } = req.query;

    // Calculate time ranges
    let days = 30;
    if (period === 'W') days = 7;
    else if (period === 'Q') days = 90;
    else if (period === 'Y') days = 365;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000);
    const since60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [
      incomeHistory,
      expenseHistory,
      goals,
      recurringRules,
    ] = await Promise.all([
      loadIncomeHistory(userId),
      loadExpenseHistory(userId),
      Goal.find(buildUserQuery(userId)).sort({ createdAt: -1 }).lean(),
      RecurringRule.find(buildUserQuery(userId)).sort({ createdAt: -1 }).lean(),
    ]);

    const within = (row, since, until) => {
      const d = new Date(row.date || row.createdAt);
      if (Number.isNaN(d.getTime())) return false;
      if (since && d < since) return false;
      if (until && d > until) return false;
      return true;
    };

    const periodIncomeTransactions = incomeHistory.filter((row) => within(row, startDate));
    const periodExpenseTransactions = expenseHistory.filter((row) => within(row, startDate));
    const prevPeriodIncomeTransactions = incomeHistory.filter((row) => within(row, prevStartDate, startDate));
    const prevPeriodExpenseTransactions = expenseHistory.filter((row) => within(row, prevStartDate, startDate));
    const last60DaysIncomeTransactions = incomeHistory.filter((row) => within(row, since60Days));
    const last60DaysExpenseTransactions = expenseHistory.filter((row) => within(row, since60Days));
    const recentIncomeTransactions = [...incomeHistory].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 5);
    const recentExpenseTransactions = [...expenseHistory].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 5);

    const totalAllTimeIncome = incomeHistory.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalAllTimeExpense = expenseHistory.reduce((sum, t) => sum + (t.amount || 0), 0);
    const periodIncomeTotal = periodIncomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const periodExpenseTotal = periodExpenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const prevPeriodIncomeTotal = prevPeriodIncomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const prevPeriodExpenseTotal = prevPeriodExpenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenseByCategory = groupExpensesByCategory(periodExpenseTransactions);

    // fetch latest transactions (income + expenses)
    const lastTransactions = [...recentIncomeTransactions, ...recentExpenseTransactions]
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const goalItems = goals.map((goal) => {
        const targetAmount = Number(goal.targetAmount || 0);
        const currentAmount = Number(goal.currentAmount || 0);
        const progress = targetAmount > 0 ? Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100)) : 0;
        return {
            _id: goal._id,
            title: goal.title,
            targetAmount,
            currentAmount,
            status: goal.status,
            targetDate: goal.targetDate,
            progress,
        };
    });
    const activeGoalsCount = goalItems.filter((goal) => goal.status === "active").length;
    const goalsTotalTargetAmount = goalItems.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const goalsTotalCurrentAmount = goalItems.reduce((sum, goal) => sum + goal.currentAmount, 0);

    const recurringItems = recurringRules.map((rule) => ({
        _id: rule._id,
        type: rule.type,
        category: rule.category,
        source: rule.source || "",
        amount: Number(rule.amount || 0),
        repeat: rule.repeat,
        isActive: !!rule.isActive,
    }));
    const activeRecurringCount = recurringItems.filter((rule) => rule.isActive).length;
    const recurringMonthlyTotal = recurringItems
        .filter((rule) => rule.isActive)
        .reduce((sum, rule) => sum + rule.amount, 0);

    res.json({
      totalBalance: totalAllTimeIncome - totalAllTimeExpense,
      totalIncome: periodIncomeTotal,
      totalExpenses: periodExpenseTotal,
      prevPeriodIncome: prevPeriodIncomeTotal,
      prevPeriodExpenses: prevPeriodExpenseTotal,
      last60DaysIncome: {
        total: last60DaysIncomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        transactions: last60DaysIncomeTransactions,
      },
      last60DaysExpense: {
        total: last60DaysExpenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        transactions: last60DaysExpenseTransactions,
      },
      periodData: {
        income: {
          total: periodIncomeTotal,
          transactions: periodIncomeTransactions,
        },
        expense: {
          total: periodExpenseTotal,
          transactions: periodExpenseTransactions,
        },
      },
      recentTransactions: lastTransactions,
      goals: {
        total: goalItems.length,
        active: activeGoalsCount,
        totalTargetAmount: goalsTotalTargetAmount,
        totalCurrentAmount: goalsTotalCurrentAmount,
        items: goalItems,
      },
      recurring: {
        total: recurringItems.length,
        active: activeRecurringCount,
        monthlyTotal: recurringMonthlyTotal,
        items: recurringItems,
      },
      spendingByCategory: expenseByCategory,
    });
    } catch (error){
        res.status(500).json({ message: "Server Error", error});
    }
}
