// =================== ACHIEVEMENTS SYSTEM ===================
// Each achievement has an id, name, icon, description, and a check function

const ACHIEVEMENTS = [
    {
        id: "first_steps",
        name: "First Steps",
        icon: "🎓",
        description: "Complete your first quiz",
        check: (stats) => stats.totalQuizzes >= 1
    },
    {
        id: "chemistry_novice",
        name: "Chemistry Novice",
        icon: "🧪",
        description: "Complete 5 quizzes",
        check: (stats) => stats.totalQuizzes >= 5
    },
    {
        id: "chemistry_expert",
        name: "Chemistry Expert",
        icon: "🏆",
        description: "Complete 20 quizzes",
        check: (stats) => stats.totalQuizzes >= 20
    },
    {
        id: "perfect_score",
        name: "Perfect Score",
        icon: "💯",
        description: "Score 100% on any quiz",
        check: (stats) => stats.hasPerfectScore === true
    },
    {
        id: "speed_demon",
        name: "Speed Demon",
        icon: "⚡",
        description: "Complete a quiz in under 2 minutes",
        check: (stats) => stats.fastestTime !== null && stats.fastestTime < 120
    },
    {
        id: "hard_hitter",
        name: "Hard Hitter",
        icon: "💪",
        description: "Score 80%+ on a Hard quiz",
        check: (stats) => stats.bestHardScore >= 80
    },
    {
        id: "well_rounded",
        name: "Well Rounded",
        icon: "🌟",
        description: "Complete quizzes in 5 different topics",
        check: (stats) => stats.topicsAttempted >= 5
    },
    {
        id: "topic_master",
        name: "Topic Master",
        icon: "👑",
        description: "Complete all 3 difficulties in any single topic",
        check: (stats) => stats.hasTopicMastery === true
    },
    {
        id: "streak_champion",
        name: "Streak Champion",
        icon: "🔥",
        description: "Answer 10 questions correctly in a row",
        check: (stats) => stats.longestStreak >= 10
    },
    {
        id: "centurion",
        name: "Centurion",
        icon: "🎖️",
        description: "Answer 100 questions correctly in total",
        check: (stats) => stats.totalCorrect >= 100
    }
];
