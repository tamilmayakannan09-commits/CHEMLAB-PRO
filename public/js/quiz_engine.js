// =================== QUIZ ENGINE ===================
// Core quiz logic: state management, timer, scoring, XP, localStorage persistence

// ---- Constants ----
const STORAGE_KEY = 'chemlab_quiz_stats';
const DIFFICULTY_CONFIG = {
    Easy:   { time: 15 * 60, questionsCount: 10, xpPerCorrect: 10 },
    Medium: { time: 20 * 60, questionsCount: 15, xpPerCorrect: 20 },
    Hard:   { time: 30 * 60, questionsCount: 15, xpPerCorrect: 30 }
};
const XP_PER_LEVEL = 200;

// ---- State ----
let quizState = {
    active: false,
    topic: null,
    difficulty: null,
    questions: [],
    currentIndex: 0,
    answers: [],        // user's selected answer index for each question (-1 = unanswered)
    timeRemaining: 0,
    timerInterval: null,
    startTime: null
};

// =================== LOCAL STORAGE ===================

function getStats() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultStats();
    try {
        return JSON.parse(raw);
    } catch {
        return createDefaultStats();
    }
}

function saveStats(stats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function createDefaultStats() {
    return {
        totalQuizzes: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        highestScore: 0,
        hasPerfectScore: false,
        fastestTime: null,
        bestHardScore: 0,
        longestStreak: 0,
        topicsAttempted: 0,
        hasTopicMastery: false,
        totalXP: 0,
        topicHistory: {},   // { topicName: { Easy: true, Medium: false, Hard: false, bestScore: 80 } }
        quizHistory: []     // last 50 quiz results
    };
}

// =================== DASHBOARD INITIALIZATION ===================

function initDashboard() {
    const stats = getStats();
    renderStats(stats);
    renderAchievements(stats);
    renderTopics(stats);
}

function renderStats(stats) {
    const level = Math.floor(stats.totalXP / XP_PER_LEVEL) + 1;
    const xpInLevel = stats.totalXP % XP_PER_LEVEL;

    document.getElementById('stat-quizzes').textContent = stats.totalQuizzes;
    document.getElementById('stat-score').textContent = stats.highestScore + '%';
    document.getElementById('stat-accuracy').textContent =
        stats.totalAnswered > 0
            ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) + '%'
            : '0%';
    document.getElementById('stat-level').textContent = `Lv. ${level} (${stats.totalXP} XP)`;
}

function renderAchievements(stats) {
    const container = document.getElementById('achievements-container');
    if (!container || typeof ACHIEVEMENTS === 'undefined') return;

    container.innerHTML = ACHIEVEMENTS.map(ach => {
        const unlocked = ach.check(stats);
        return `
            <div class="glass-panel stat-card achievement-card ${unlocked ? 'unlocked' : 'locked'}"
                 style="opacity: ${unlocked ? '1' : '0.4'}; cursor: default;">
                <div class="stat-icon" style="font-size: 28px;">${ach.icon}</div>
                <div class="stat-info">
                    <h3 style="font-size: 13px;">${ach.name}</h3>
                    <p style="font-size: 12px; font-weight: normal; color: var(--text-muted);">${ach.description}</p>
                </div>
                ${unlocked ? '<span style="color: var(--success); font-size: 18px; margin-left: auto;">✔</span>' : ''}
            </div>
        `;
    }).join('');
}

function renderTopics(stats) {
    const container = document.getElementById('topics-container');
    if (!container || typeof QUIZ_TOPICS === 'undefined') return;

    container.innerHTML = QUIZ_TOPICS.map(topic => {
        const meta = TOPIC_META[topic] || { icon: '🧪', description: '', color: '#4299e1' };
        const topicStats = stats.topicHistory[topic] || {};
        const completedDiffs = ['Easy', 'Medium', 'Hard'].filter(d => topicStats[d]).length;
        const progress = Math.round((completedDiffs / 3) * 100);
        const bestScore = topicStats.bestScore || 0;

        return `
            <div class="glass-panel topic-card" onclick="openDifficultyModal('${topic}')" style="cursor: pointer;">
                <div class="topic-header">
                    <span class="topic-title">${meta.icon} ${topic}</span>
                    ${bestScore > 0 ? `<span style="font-size: 12px; color: var(--success); font-weight: bold;">${bestScore}%</span>` : ''}
                </div>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">${meta.description}</p>
                <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                    ${['Easy', 'Medium', 'Hard'].map(d => `
                        <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px;
                            background: ${topicStats[d] ? 'var(--success)' : 'rgba(255,255,255,0.1)'};
                            color: ${topicStats[d] ? 'white' : 'var(--text-muted)'};">
                            ${d} ${topicStats[d] ? '✔' : ''}
                        </span>
                    `).join('')}
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress}%; background: ${meta.color};"></div>
                </div>
            </div>
        `;
    }).join('');
}

// =================== DIFFICULTY MODAL ===================

let selectedTopic = null;

function openDifficultyModal(topic) {
    selectedTopic = topic;
    const modal = document.getElementById('difficulty-modal');
    const title = document.getElementById('modal-topic-title');
    if (title) {
        const meta = TOPIC_META[topic] || { icon: '🧪' };
        title.textContent = `${meta.icon} ${topic}`;
    }
    modal.classList.add('active');
}

function closeDifficultyModal() {
    document.getElementById('difficulty-modal').classList.remove('active');
    selectedTopic = null;
}

function handleDifficultySelect(difficulty) {
    const topic = selectedTopic;
    closeDifficultyModal();
    if (topic) {
        startQuiz(topic, difficulty);
    }
}

// =================== QUIZ LIFECYCLE ===================

function startQuiz(topic, difficulty) {
    const config = DIFFICULTY_CONFIG[difficulty];
    if (!config) return;

    // Filter and shuffle questions
    const pool = QUESTIONS.filter(q => q.topic === topic && q.difficulty === difficulty);
    const shuffled = shuffleArray([...pool]);
    const selected = shuffled.slice(0, Math.min(config.questionsCount, shuffled.length));

    if (selected.length === 0) {
        alert('No questions available for this topic and difficulty.');
        return;
    }

    // Initialize state
    quizState = {
        active: true,
        topic,
        difficulty,
        questions: selected,
        currentIndex: 0,
        answers: new Array(selected.length).fill(-1),
        timeRemaining: config.time,
        timerInterval: null,
        startTime: Date.now()
    };

    // Switch views
    showView('quiz-view');

    // Render first question
    showQuestion(0);

    // Start timer
    startTimer();
}

function showQuestion(index) {
    if (index < 0 || index >= quizState.questions.length) return;
    quizState.currentIndex = index;

    const q = quizState.questions[index];
    const total = quizState.questions.length;

    // Update counter
    document.getElementById('question-counter').textContent = `Question ${index + 1} of ${total}`;

    // Update progress bar
    const progress = ((index + 1) / total) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';

    // Update question text
    document.getElementById('question-text').textContent = q.question;

    // Update options
    const optContainer = document.getElementById('options-container');
    optContainer.innerHTML = q.options.map((opt, i) => `
        <button class="option-btn ${quizState.answers[index] === i ? 'selected' : ''}"
                onclick="selectOption(${i})"
                id="option-${i}">
            <span style="font-weight: bold; margin-right: 10px; opacity: 0.5;">${String.fromCharCode(65 + i)}.</span>
            ${opt}
        </button>
    `).join('');

    // Update navigation buttons
    document.getElementById('prev-btn').style.visibility = index === 0 ? 'hidden' : 'visible';

    const isLast = index === total - 1;
    document.getElementById('next-btn').style.display = isLast ? 'none' : 'inline-block';
    document.getElementById('submit-btn').style.display = isLast ? 'inline-block' : 'none';
}

function selectOption(optionIndex) {
    quizState.answers[quizState.currentIndex] = optionIndex;

    // Update UI
    document.querySelectorAll('.option-btn').forEach((btn, i) => {
        btn.classList.toggle('selected', i === optionIndex);
    });
}

function nextQuestion() {
    if (quizState.currentIndex < quizState.questions.length - 1) {
        showQuestion(quizState.currentIndex + 1);
    }
}

function prevQuestion() {
    if (quizState.currentIndex > 0) {
        showQuestion(quizState.currentIndex - 1);
    }
}

// =================== TIMER ===================

function startTimer() {
    updateTimerDisplay();
    quizState.timerInterval = setInterval(() => {
        quizState.timeRemaining--;
        updateTimerDisplay();

        if (quizState.timeRemaining <= 0) {
            clearInterval(quizState.timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(quizState.timeRemaining / 60);
    const secs = quizState.timeRemaining % 60;
    const display = document.getElementById('timer-display');
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Add danger class when < 60 seconds
    if (quizState.timeRemaining <= 60) {
        display.classList.add('danger');
    } else {
        display.classList.remove('danger');
    }
}

// =================== SUBMIT & RESULTS ===================

function submitQuiz() {
    if (!quizState.active) return;

    // Confirm if not all answered (unless auto-submitted by timer)
    const unanswered = quizState.answers.filter(a => a === -1).length;
    if (unanswered > 0 && quizState.timeRemaining > 0) {
        if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }

    // Stop timer
    clearInterval(quizState.timerInterval);
    quizState.active = false;

    // Calculate score
    let correct = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    quizState.questions.forEach((q, i) => {
        const isCorrect = quizState.answers[i] === q.answer;
        if (isCorrect) {
            correct++;
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    });

    const total = quizState.questions.length;
    const percentage = Math.round((correct / total) * 100);
    const config = DIFFICULTY_CONFIG[quizState.difficulty];
    const xpEarned = correct * config.xpPerCorrect;
    const timeTaken = Math.round((Date.now() - quizState.startTime) / 1000);

    // Update localStorage stats
    updateStats(correct, total, percentage, xpEarned, timeTaken, maxStreak);

    // Show results modal
    showResults(correct, total, percentage, xpEarned, timeTaken);

    // Save to backend if logged in
    saveScoreToBackend(percentage, correct, total, xpEarned, timeTaken);
}

function updateStats(correct, total, percentage, xpEarned, timeTaken, maxStreak) {
    const stats = getStats();

    stats.totalQuizzes++;
    stats.totalCorrect += correct;
    stats.totalAnswered += total;
    stats.totalXP += xpEarned;

    if (percentage > stats.highestScore) stats.highestScore = percentage;
    if (percentage === 100) stats.hasPerfectScore = true;
    if (stats.fastestTime === null || timeTaken < stats.fastestTime) stats.fastestTime = timeTaken;
    if (maxStreak > stats.longestStreak) stats.longestStreak = maxStreak;

    if (quizState.difficulty === 'Hard' && percentage > stats.bestHardScore) {
        stats.bestHardScore = percentage;
    }

    // Update topic history
    if (!stats.topicHistory[quizState.topic]) {
        stats.topicHistory[quizState.topic] = {};
    }
    const th = stats.topicHistory[quizState.topic];
    th[quizState.difficulty] = true;
    if (!th.bestScore || percentage > th.bestScore) th.bestScore = percentage;

    // Check topic mastery
    stats.hasTopicMastery = Object.values(stats.topicHistory).some(
        t => t.Easy && t.Medium && t.Hard
    );

    // Count topics attempted
    stats.topicsAttempted = Object.keys(stats.topicHistory).length;

    // Add to history (keep last 50)
    stats.quizHistory.unshift({
        topic: quizState.topic,
        difficulty: quizState.difficulty,
        score: correct,
        total,
        percentage,
        xpEarned,
        timeTaken,
        date: new Date().toISOString()
    });
    if (stats.quizHistory.length > 50) stats.quizHistory = stats.quizHistory.slice(0, 50);

    saveStats(stats);
}

function showResults(correct, total, percentage, xpEarned, timeTaken) {
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;

    let gradeEmoji, gradeText, gradeColor;
    if (percentage === 100) { gradeEmoji = '🏆'; gradeText = 'PERFECT!'; gradeColor = '#ffd700'; }
    else if (percentage >= 80) { gradeEmoji = '🌟'; gradeText = 'Excellent!'; gradeColor = 'var(--success)'; }
    else if (percentage >= 60) { gradeEmoji = '👍'; gradeText = 'Good Job!'; gradeColor = 'var(--primary)'; }
    else if (percentage >= 40) { gradeEmoji = '📚'; gradeText = 'Keep Learning!'; gradeColor = 'var(--warning)'; }
    else { gradeEmoji = '💪'; gradeText = 'Try Again!'; gradeColor = 'var(--danger)'; }

    // Trigger confetti for high scores
    if (percentage >= 80) triggerCelebration(gradeEmoji);

    const modal = document.getElementById('results-modal');
    const content = document.getElementById('results-content');
    content.innerHTML = `
        <div style="text-align: center; padding: 10px 0;">
            <div style="font-size: 64px; margin-bottom: 10px;">${gradeEmoji}</div>
            <h2 style="font-size: 28px; color: ${gradeColor}; margin-bottom: 5px;">${gradeText}</h2>
            <p style="color: var(--text-muted); margin-bottom: 25px;">${quizState.topic} — ${quizState.difficulty}</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                <div class="glass-panel" style="padding: 15px; border-radius: 10px;">
                    <div style="font-size: 32px; font-weight: bold; color: ${gradeColor};">${correct}/${total}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Correct Answers</div>
                </div>
                <div class="glass-panel" style="padding: 15px; border-radius: 10px;">
                    <div style="font-size: 32px; font-weight: bold; color: var(--primary);">${percentage}%</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Score</div>
                </div>
                <div class="glass-panel" style="padding: 15px; border-radius: 10px;">
                    <div style="font-size: 32px; font-weight: bold; color: var(--warning);">${mins}:${String(secs).padStart(2, '0')}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Time Taken</div>
                </div>
                <div class="glass-panel" style="padding: 15px; border-radius: 10px;">
                    <div style="font-size: 32px; font-weight: bold; color: var(--success);">+${xpEarned}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">XP Earned</div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="showReviewFromResults()">📝 Review Answers</button>
                <button class="btn btn-secondary" onclick="closeResults()">🏠 Back to Dashboard</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

function closeResults() {
    document.getElementById('results-modal').classList.remove('active');
    showView('dashboard-view');
    initDashboard();
}

function showReviewFromResults() {
    document.getElementById('results-modal').classList.remove('active');
    showReview();
}

// =================== REVIEW MODE ===================

function showReview() {
    showView('review-view');
    const container = document.getElementById('review-content');
    if (!container) return;

    container.innerHTML = quizState.questions.map((q, i) => {
        const userAnswer = quizState.answers[i];
        const isCorrect = userAnswer === q.answer;
        const isUnanswered = userAnswer === -1;

        return `
            <div class="glass-panel review-item ${isCorrect ? 'correct' : 'incorrect'}"
                 style="padding: 20px; margin-bottom: 15px; border-left: 4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: var(--text-muted);">Question ${i + 1}</span>
                    <span style="font-size: 13px; padding: 3px 10px; border-radius: 4px;
                        background: ${isCorrect ? 'rgba(72,187,120,0.15)' : 'rgba(229,62,62,0.15)'};
                        color: ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
                        ${isCorrect ? '✔ Correct' : isUnanswered ? '⊘ Unanswered' : '✘ Incorrect'}
                    </span>
                </div>
                <h3 style="font-size: 16px; margin-bottom: 12px; line-height: 1.4;">${q.question}</h3>

                <div style="display: grid; gap: 8px; margin-bottom: 12px;">
                    ${q.options.map((opt, j) => {
                        let style = 'padding: 10px 14px; border-radius: 6px; font-size: 14px; ';
                        if (j === q.answer) {
                            style += 'background: rgba(72,187,120,0.15); border: 1px solid var(--success); color: var(--success);';
                        } else if (j === userAnswer && !isCorrect) {
                            style += 'background: rgba(229,62,62,0.15); border: 1px solid var(--danger); color: var(--danger); text-decoration: line-through;';
                        } else {
                            style += 'background: rgba(255,255,255,0.03); border: 1px solid transparent; color: var(--text-muted);';
                        }
                        return `<div style="${style}">
                            <span style="font-weight: bold; margin-right: 8px; opacity: 0.5;">${String.fromCharCode(65 + j)}.</span>
                            ${opt}
                            ${j === q.answer ? ' ✔' : ''}
                            ${j === userAnswer && !isCorrect ? ' ✘' : ''}
                        </div>`;
                    }).join('')}
                </div>

                <div class="explanation-box" style="background: rgba(66,153,225,0.08); border: 1px solid rgba(66,153,225,0.2); padding: 12px; border-radius: 8px;">
                    <strong style="color: var(--primary);">💡 Explanation:</strong>
                    <span style="color: var(--text-muted);"> ${q.explanation}</span>
                </div>
                ${q.funFact ? `
                    <div class="fact-box" style="margin-top: 8px; padding: 8px 12px; border-radius: 6px; background: rgba(159,122,234,0.08); border: 1px solid rgba(159,122,234,0.2);">
                        <strong style="color: #9f7aea;">🔬 Fun Fact:</strong>
                        <span style="color: var(--text-muted); font-style: italic;"> ${q.funFact}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function closeReview() {
    showView('dashboard-view');
    initDashboard();
}

// =================== BACKEND SYNC ===================

async function saveScoreToBackend(percentage, correct, total, xpEarned, timeTaken) {
    // Only save if user is logged in (check for auth/api objects from main app)
    if (typeof api === 'undefined' || typeof auth === 'undefined') return;
    if (!auth.isLoggedIn()) return;

    try {
        await api.post('/quiz/scores', {
            topic: quizState.topic,
            difficulty: quizState.difficulty,
            score: correct,
            total_questions: total,
            percentage,
            time_taken: timeTaken,
            xp_earned: xpEarned
        });
    } catch (e) {
        console.warn('Could not save quiz score to backend:', e);
    }
}

// =================== HELPERS ===================

function showView(viewId) {
    ['dashboard-view', 'quiz-view', 'review-view'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('hidden', id !== viewId);
            if (id === viewId) {
                el.classList.remove('hidden');
                // Re-trigger fade-in animation
                el.style.animation = 'none';
                el.offsetHeight; // trigger reflow
                el.style.animation = '';
            }
        }
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function triggerCelebration(emoji) {
    const el = document.createElement('div');
    el.className = 'celebration';
    el.textContent = emoji;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

// =================== EVENT LISTENERS ===================

document.addEventListener('DOMContentLoaded', () => {
    // Wire up navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (prevBtn) prevBtn.addEventListener('click', prevQuestion);
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
    if (submitBtn) submitBtn.addEventListener('click', submitQuiz);

    // Initialize dashboard
    initDashboard();
});
