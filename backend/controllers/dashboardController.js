const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Goal = require("../models/Goal");
const RecurringRule = require("../models/RecurringRule");

const { isValidObjectId, Types } = require("mongoose");

exports.getDashboardData = async (req,res) => {
    try{
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));

    const start30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 *1000);
    const start60DaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [
        totalIncome,
        totalExpense,
        last60DaysIncomeTransactions,
        last30DaysExpenseTransactions,
        recentIncomeTransactions,
        recentExpenseTransactions,
        goals,
        recurringRules,
        expenseByCategory,
    ] = await Promise.all([
        Income.aggregate([
            { $match: {userId: userObjectId } },
            { $group: { _id:null, total: {$sum: "$amount" } } },
        ]),
        Expense.aggregate([
            { $match: {userId: userObjectId } },
            { $group: { _id:null, total: {$sum: "$amount" } } },
        ]),
        Income.find({
            userId,
            date: { $gte: start60DaysAgo },
        }).sort({ date: -1 }),
        Expense.find({
            userId,
            date: { $gte: start30DaysAgo },
        }).sort({ date: -1 }),
        Income.find({ userId }).sort({ date: - 1}).limit(5),
        Expense.find({userId}).sort({date: -1}).limit(5),
        Goal.find({ userId }).sort({ createdAt: -1 }).lean(),
        RecurringRule.find({ userId }).sort({ createdAt: -1 }).lean(),
        Expense.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: { $ifNull: ["$categoryName", "$category", "Uncategorized"] }, total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
        ]),
    ]);
    console.log("totalIncome", {totalIncome, userId: isValidObjectId(userId)});

    const incomeLast60days = last60DaysIncomeTransactions.reduce(
        (sum, transaction) => sum + (transaction.amount || 0),
        0
    );

    const expensesLast30days = last30DaysExpenseTransactions.reduce(
        (sum, transaction) => sum + (transaction.amount || 0),
        0
    );

    // fetch lst5 transactions(income + expenses)
    const lastTransactions = [
        ...recentIncomeTransactions.map((txn) => ({
            ...txn.toObject(),
            type: "income",
        })),
        ...recentExpenseTransactions.map((txn) => ({
            ...txn.toObject(),
            type: "expense",
        })),
    ].sort((a,b) => b.date - a.date); //sort lastest first

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

    const grandTotal = expenseByCategory.reduce((sum, c) => sum + c.total, 0);
    const spendingByCategory = expenseByCategory.map((c) => ({
        name: c._id || "Uncategorized",
        value: grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0,
        total: c.total,
    })).filter((c) => c.value > 0);

    res.json({
        totalBalance:
            (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
        totalIncome: totalIncome[0]?.total || 0,
        totalExpenses: totalExpense[0]?.total || 0,
        last30DaysExpenses: {
            total: expensesLast30days,
            transactions: last30DaysExpenseTransactions,
        },
        last60DaysIncome: {
            total: incomeLast60days,
            transactions: last60DaysIncomeTransactions,
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
        spendingByCategory,
    });
    } catch (error){
        res.status(500).json({ message: "Server Error", error});
    }
}
