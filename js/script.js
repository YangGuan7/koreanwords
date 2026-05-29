import { initWords, getWords, startStudy } from './quiz.js';

async function startApp() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const flashCard = document.getElementById('flashCard');

    // 1. 觸發歡迎畫面的 Q 彈淡出縮小動畫
    if (welcomeScreen) {
        welcomeScreen.classList.add('fade-out');
    }

    // 2. 初始化單字資料庫
    await initWords();

    // 3. 延遲 300 毫秒（等歡迎畫面播到一半時），讓單字卡帶有魔法般由下往上浮現登場
    setTimeout(() => {
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none'; // 動化播完後正式移除
        }

        // 啟動刷卡機制
        startStudy(getWords());

        // 幫剛登場的卡片加上浮現動畫 Class
        if (flashCard) {
            flashCard.classList.add('card-appear');
            // 動畫播完後把 Class 拔掉，才不會干擾後續左右滑動的手勢
            setTimeout(() => {
                flashCard.classList.remove('card-appear');
            }, 600);
        }
    }, 300);
}

document.getElementById('startBtn').addEventListener('click', startApp);