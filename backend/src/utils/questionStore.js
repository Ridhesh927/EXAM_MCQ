const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const logger = require('./logger');

let questions = [];

/**
 * Loads coding questions from CSV files in the asset directory.
 * Focuses on questions_dataset.csv as it's a manageable size.
 * test.csv is ignored for bulk loading due to its 1.2GB size.
 */
const loadQuestions = () => {
    try {
        const filePath = path.join(__dirname, '..', '..', '..', 'asset', 'questions_dataset.csv');
        if (!fs.existsSync(filePath)) {
            logger('WARN', 'questions_dataset.csv not found in assets');
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        questions = records.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            difficulty: r.difficulty_level || r.difficulty,
            examples: parseJsonSafe(r.examples, []),
            constraints: parseJsonSafe(r.constraints, []),
            test_cases: parseJsonSafe(r.test_cases, [])
        }));

        logger('INFO', `Loaded ${questions.length} questions from CSV dataset`);
    } catch (error) {
        logger('ERROR', 'Failed to load CSV questions', { error: error.message });
    }
};

const parseJsonSafe = (str, fallback) => {
    if (!str) return fallback;
    try {
        // Handle double-escaped quotes often found in CSVs
        const sanitized = str.replace(/""/g, '"');
        return JSON.parse(str);
    } catch (e) {
        try {
             return JSON.parse(str.replace(/""/g, '"'));
        } catch (e2) {
            return fallback;
        }
    }
};

const getRandomQuestions = (difficulty, count = 1) => {
    if (questions.length === 0) return [];
    
    const filtered = questions.filter(q => 
        q.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
    
    if (filtered.length === 0) return [];
    
    // Shuffle and pick
    return filtered
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
};

const getSamplesForAI = (count = 3) => {
    return questions
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
};

// Initialize on load
loadQuestions();

module.exports = {
    getRandomQuestions,
    getSamplesForAI,
    hasQuestions: () => questions.length > 0
};
