const COMPANY_LIBRARY = {
    General: {
        codingPatterns: ['Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window', 'Recursion'],
        aptitudePatterns: ['Percentages', 'Time and Work', 'Ratio and Proportion', 'Logical Puzzles'],
        notes: 'Balanced placement-prep style questions suitable for most service and product companies.'
    },
    TCS: {
        codingPatterns: ['Basic DSA', 'String processing', 'Array manipulations', 'Pattern-based loops', 'Greedy basics'],
        aptitudePatterns: ['Number series', 'Percentages', 'Profit and loss', 'Time-speed-distance', 'Logical reasoning'],
        notes: 'Favors straightforward implementation and strong fundamentals in coding + aptitude.'
    },
    Infosys: {
        codingPatterns: ['Arrays', 'Strings', 'Hash maps', 'Sorting and searching'],
        aptitudePatterns: ['Data interpretation', 'Syllogism', 'Logical deductions', 'Quantitative aptitude'],
        notes: 'Commonly asks coding with clean constraints and aptitude with moderate reasoning depth.'
    },
    Wipro: {
        codingPatterns: ['Basic algorithms', 'String/array transforms', 'Loop-based problems'],
        aptitudePatterns: ['Verbal logic', 'Quant basics', 'Analytical reasoning'],
        notes: 'Often evaluates consistency and implementation clarity more than extreme algorithmic depth.'
    },
    Amazon: {
        codingPatterns: ['Hash maps', 'Sliding window', 'Trees', 'Graphs', 'Heap/Priority queue', 'Dynamic programming'],
        aptitudePatterns: ['Analytical reasoning', 'Data interpretation', 'Business logic caselets'],
        notes: 'Typically prefers optimized solutions, edge-case handling, and strong problem-solving structure.'
    },
    Google: {
        codingPatterns: ['Advanced arrays/strings', 'Graphs', 'Trees', 'DP', 'Greedy + proofs'],
        aptitudePatterns: ['Complex logic puzzles', 'Pattern inference', 'Quant reasoning'],
        notes: 'Higher emphasis on optimality, abstractions, and clear communication of approach.'
    },
    Microsoft: {
        codingPatterns: ['Arrays', 'Strings', 'Trees', 'Graphs', 'Design-oriented coding'],
        aptitudePatterns: ['Logical reasoning', 'Case-based analytics'],
        notes: 'Balances coding rigor with readability and practical engineering thought process.'
    }
};

const getCompanyProfile = (companyName) => {
    if (!companyName) return { name: 'General', ...COMPANY_LIBRARY.General };
    const normalized = String(companyName).trim();
    const key = Object.keys(COMPANY_LIBRARY).find(
        (name) => name.toLowerCase() === normalized.toLowerCase()
    );
    const finalKey = key || 'General';
    return { name: finalKey, ...COMPANY_LIBRARY[finalKey] };
};

const getSupportedCompanies = () => Object.keys(COMPANY_LIBRARY);

module.exports = {
    getCompanyProfile,
    getSupportedCompanies,
};
