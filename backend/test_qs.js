const qs = require('./src/utils/questionStore');
console.log('Has questions:', qs.hasQuestions());
if (qs.hasQuestions()) {
    const easy = qs.getRandomQuestions('Easy', 1);
    console.log('Random Easy Question Title:', easy[0]?.title);
    console.log('Difficulty:', easy[0]?.difficulty);
    console.log('Description Snippet:', easy[0]?.description?.substring(0, 50));
}
process.exit(0);
