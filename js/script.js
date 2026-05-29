import { initWords, getWords, startStudy } from './quiz.js';

async function startApp() {
    // 1. 隱藏歡迎畫面遮罩
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    // 2. 初始化單字並開始
    await initWords();
    startStudy(getWords());
}
import { resetAllWordProgress } from './pushData.js';
document.getElementById('resetBtn').addEventListener('click', resetAllWordProgress);

document.getElementById('startBtn').addEventListener('click', startApp);