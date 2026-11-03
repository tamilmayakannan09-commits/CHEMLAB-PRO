const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const calculationRoutes = require('./routes/calculations');
const experimentRoutes = require('./routes/experiments');
const feedbackRoutes = require('./routes/feedback');
const quizRoutes = require('./routes/quiz');
const aiRoutes = require('./routes/ai');
const reactionRoutes = require('./routes/reactions');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Dedicated PDF Download Route - forces browser to download as .pdf attachment
app.post('/api/reports/download-pdf', (req, res) => {
    try {
        const { filename, pdfBase64 } = req.body;
        if (!pdfBase64) {
            return res.status(400).send('No PDF data provided');
        }

        const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        
        let safeName = (filename || 'Lab_Report.pdf').trim();
        safeName = safeName.replace(/[^a-zA-Z0-9_.-]/g, '_');
        if (!safeName.toLowerCase().endsWith('.pdf')) {
            safeName += '.pdf';
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF stream download error:', err);
        return res.status(500).send('Failed to process PDF download');
    }
});

// Serve static frontend files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reactions', reactionRoutes);

// Dashboard stats endpoint (combines data from multiple collections)
const auth = require('./middleware/auth');
const Calculation = require('./models/Calculation');
const Experiment = require('./models/Experiment');

app.get('/api/dashboard/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const totalCalculations = await Calculation.countDocuments({ user_id: userId });
        const totalExperiments = await Experiment.countDocuments({ user_id: userId });
        const completedExperiments = await Experiment.countDocuments({ user_id: userId, experiment_status: 'completed' });

        const allExperiments = await Experiment.find({ user_id: userId });
        const totalTrials = allExperiments.reduce((sum, exp) => sum + exp.trials.length, 0);

        // Get calculation type distribution
        const calcTypes = await Calculation.aggregate([
            { $match: { user_id: req.user.id } },
            { $group: { _id: '$calculation_type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent calculations
        const recentCalculations = await Calculation.find({ user_id: userId })
            .sort({ date_time: -1 })
            .limit(5);

        // Recent experiments
        const recentExperiments = await Experiment.find({ user_id: userId })
            .sort({ date_time: -1 })
            .limit(5);

        // Average experiment accuracy
        const completedWithResults = allExperiments.filter(e => e.percentage_error !== null);
        const avgAccuracy = completedWithResults.length > 0
            ? completedWithResults.reduce((sum, e) => sum + (100 - (e.percentage_error || 0)), 0) / completedWithResults.length
            : 0;

        res.json({
            totalCalculations,
            totalExperiments,
            completedExperiments,
            attemptedExperiments: totalExperiments - completedExperiments,
            totalTrials,
            averageAccuracy: parseFloat(avgAccuracy.toFixed(1)),
            progressPercentage: parseFloat(((completedExperiments / 10) * 100).toFixed(1)),
            calcTypeDistribution: calcTypes,
            recentCalculations,
            recentExperiments
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`ChemLab Pro server running on http://localhost:${PORT}`);
});
