import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, Flame, Target, TrendingUp, FileText, Mic, PenTool, 
    MessageCircle, Clock, Plus, X, Edit2, Trash2, Loader2
} from 'lucide-react';
import { getStatsSummary, getGoals, createGoal, updateGoal, deleteGoal } from '../api';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';

const ProgressDashboard = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [goals, setGoals] = useState([]);
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, goalId: null });
    const [goalForm, setGoalForm] = useState({
        goal_type: 'words',
        target_value: 500,
        period: 'daily'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [summaryData, goalsData] = await Promise.all([
                getStatsSummary(),
                getGoals(true)
            ]);
            setSummary(summaryData);
            setGoals(goalsData.goals || []);
        } catch (error) {
            showToast('Failed to load statistics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoal = async () => {
        try {
            await createGoal(goalForm.goal_type, goalForm.target_value, goalForm.period);
            showToast('Goal created successfully!', 'success');
            setShowGoalForm(false);
            setGoalForm({ goal_type: 'words', target_value: 500, period: 'daily' });
            loadData();
        } catch (error) {
            showToast(error.message || 'Failed to create goal', 'error');
        }
    };

    const handleDeleteGoal = (goalId) => {
        setDeleteConfirmModal({ isOpen: true, goalId });
    };

    const confirmDeleteGoal = async () => {
        const { goalId } = deleteConfirmModal;
        if (!goalId) return;

        try {
            await deleteGoal(goalId);
            showToast('Goal deleted successfully', 'success');
            setDeleteConfirmModal({ isOpen: false, goalId: null });
            loadData();
        } catch (error) {
            showToast(error.message || 'Failed to delete goal', 'error');
        }
    };

    const goalTypes = {
        words: { label: 'Words Written', icon: FileText, color: 'blue' },
        writings: { label: 'Writings Created', icon: FileText, color: 'purple' },
        speeches: { label: 'Speeches Practiced', icon: Mic, color: 'green' },
        poems: { label: 'Poems Created', icon: PenTool, color: 'pink' },
        conversations: { label: 'Conversations', icon: MessageCircle, color: 'orange' }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Failed to load statistics</p>
            </div>
        );
    }

    const { streak, today_stats, weekly_stats, goals: summaryGoals } = summary;

    return (
        <div className="w-full h-full overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Progress & Statistics
                </h1>
            </motion.div>

            {/* Streak Counter */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 rounded-2xl border border-gray-800/50"
            >
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
                        <Flame className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Current Streak</p>
                        <p className="text-4xl font-bold text-white">
                            {streak.streak_days} {streak.streak_days === 1 ? 'Day' : 'Days'}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Today's Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 rounded-2xl border border-gray-800/50"
            >
                <h2 className="text-xl font-semibold mb-4 text-white">Today's Progress</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard
                        icon={FileText}
                        label="Writings"
                        value={today_stats.writings_created}
                        color="blue"
                    />
                    <StatCard
                        icon={Mic}
                        label="Speeches"
                        value={today_stats.speeches_practiced}
                        color="green"
                    />
                    <StatCard
                        icon={PenTool}
                        label="Poems"
                        value={today_stats.poems_created}
                        color="pink"
                    />
                    <StatCard
                        icon={MessageCircle}
                        label="Conversations"
                        value={today_stats.conversations_completed}
                        color="orange"
                    />
                    <StatCard
                        icon={FileText}
                        label="Words"
                        value={today_stats.total_words_written}
                        color="purple"
                    />
                </div>
                {today_stats.audio_minutes_listened > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span>Audio listened: {today_stats.audio_minutes_listened.toFixed(1)} minutes</span>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Weekly Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 rounded-2xl border border-gray-800/50"
            >
                <h2 className="text-xl font-semibold mb-4 text-white">Weekly Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                        <p className="text-gray-400 text-sm">Writings</p>
                        <p className="text-2xl font-bold text-white">{weekly_stats.total_writings_created}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Speeches</p>
                        <p className="text-2xl font-bold text-white">{weekly_stats.total_speeches_practiced}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Poems</p>
                        <p className="text-2xl font-bold text-white">{weekly_stats.total_poems_created}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Conversations</p>
                        <p className="text-2xl font-bold text-white">{weekly_stats.total_conversations_completed}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Words</p>
                        <p className="text-2xl font-bold text-white">{weekly_stats.total_words_written}</p>
                    </div>
                </div>
                
                {/* Simple Bar Chart for Daily Breakdown */}
                {weekly_stats.daily_breakdown && weekly_stats.daily_breakdown.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Daily Activity</h3>
                        <div className="space-y-2">
                            {weekly_stats.daily_breakdown.slice(-7).map((day, idx) => {
                                const total = day.writings_created + day.speeches_practiced + 
                                            day.poems_created + day.conversations_completed;
                                const maxTotal = Math.max(...weekly_stats.daily_breakdown.slice(-7).map(d => 
                                    d.writings_created + d.speeches_practiced + d.poems_created + d.conversations_completed
                                ), 1);
                                const percentage = (total / maxTotal) * 100;
                                
                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 w-20">
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400 w-8 text-right">{total}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Goals Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6 rounded-2xl border border-gray-800/50"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Goals</h2>
                    <button
                        onClick={() => setShowGoalForm(!showGoalForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Goal
                    </button>
                </div>

                <AnimatePresence>
                    {showGoalForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                        >
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Goal Type
                                    </label>
                                    <select
                                        value={goalForm.goal_type}
                                        onChange={(e) => setGoalForm({ ...goalForm, goal_type: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                                    >
                                        {Object.entries(goalTypes).map(([key, { label }]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Target Value
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={goalForm.target_value}
                                        onChange={(e) => setGoalForm({ ...goalForm, target_value: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Period
                                    </label>
                                    <select
                                        value={goalForm.period}
                                        onChange={(e) => setGoalForm({ ...goalForm, period: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCreateGoal}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        Create
                                    </button>
                                    <button
                                        onClick={() => setShowGoalForm(false)}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {goals.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No goals set. Create one to track your progress!</p>
                ) : (
                    <div className="space-y-3">
                        {goals.map((goal) => {
                            const goalType = goalTypes[goal.goal_type];
                            const progress = goal.progress_percentage;
                            const isComplete = progress >= 100;
                            
                            return (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 bg-gray-800/30 rounded-lg border border-gray-700"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            {goalType && (
                                                <goalType.icon className={`w-5 h-5 text-${goalType.color}-400`} />
                                            )}
                                            <div>
                                                <p className="font-medium text-white">{goalType?.label || goal.goal_type}</p>
                                                <p className="text-sm text-gray-400">
                                                    {goal.current_value} / {goal.target_value} ({goal.period})
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                            aria-label="Delete goal"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-3 bg-gray-900 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(progress, 100)}%` }}
                                            transition={{ duration: 0.5 }}
                                            className={`h-full ${
                                                isComplete
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                            }`}
                                        />
                                    </div>
                                    {isComplete && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-2 text-sm text-green-400 font-medium"
                                        >
                                            ✓ Goal completed!
                                        </motion.p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmModal.isOpen}
                onClose={() => setDeleteConfirmModal({ isOpen: false, goalId: null })}
                onConfirm={confirmDeleteGoal}
                title="Delete Goal"
                message="Are you sure you want to delete this goal? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
            />
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-600/20 text-blue-400',
        green: 'from-green-500/20 to-green-600/20 text-green-400',
        pink: 'from-pink-500/20 to-pink-600/20 text-pink-400',
        orange: 'from-orange-500/20 to-orange-600/20 text-orange-400',
        purple: 'from-purple-500/20 to-purple-600/20 text-purple-400',
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-gradient-to-br rounded-xl border border-gray-800/50"
        >
            <div className={`p-2 bg-gradient-to-br ${colorClasses[color]} rounded-lg w-fit mb-2`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
        </motion.div>
    );
};

export default ProgressDashboard;

