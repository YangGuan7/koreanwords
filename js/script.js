import { initWords, getWords, startStudy } from './quiz.js';
import { resetAllWordProgress } from './pushData.js';

async function startApp() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const flashCard = document.getElementById('flashCard');

    // 1. 取得使用者選了什麼主題
    const themeSelect = document.getElementById('themeSelect');
    const selectedTheme = themeSelect ? themeSelect.value : 'all';

    // 2. 觸發歡迎畫面的淡出動畫
    if (welcomeScreen) {
        welcomeScreen.classList.add('fade-out');
    }

    // 3. 初始化單字資料庫
    await initWords();

    // 4. 延遲 300 毫秒等歡迎畫面動畫播完後正式啟動
    setTimeout(() => {
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }

        // 啟動刷卡機制，並傳入選定的主題
        startStudy(getWords(), selectedTheme);

        if (flashCard) {
            flashCard.classList.add('card-appear');
            setTimeout(() => {
                flashCard.classList.remove('card-appear');
            }, 600);
        }
    }, 300);
}

// 綁定開始按鈕
document.getElementById('startBtn').addEventListener('click', startApp);

// 綁定清空進度按鈕
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm('確定要大洗白，將所有單字的記憶進度歸零重新開始嗎？')) {
            resetAllWordProgress();
        }
    });
}