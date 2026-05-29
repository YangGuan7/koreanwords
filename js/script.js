import { initWords, getWords, startStudy } from './quiz.js';

async function startApp() {
    await initWords();
    startStudy(getWords());
}

document.getElementById('startBtn').addEventListener('click', startApp);