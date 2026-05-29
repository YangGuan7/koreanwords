import { initPublicWords, saveWordProgress } from './pushData.js';

let words = [];
let deck = [];
let currentIndex = 0;

export async function initWords() {
    words = await initPublicWords();
    console.log('初始化抓到單字:', words);
    deck = [...words];
    return words;
}

export function getWords() { return words; }

export function startStudy(customDeck) {
    deck = customDeck ? [...customDeck] : [...words];
    currentIndex = 0;

    const flashCard = document.getElementById('flashCard');
    if (flashCard) flashCard.classList.remove('hide');

    renderCurrentCard();
    attachCardEvents();
}

export function renderCurrentCard() {
    const flashCard = document.getElementById('flashCard');
    if (!flashCard) return;

    // 檢查是否所有單字都練習完了
    if (currentIndex >= deck.length) {
        flashCard.innerHTML = `<div class="cardInner"><div class="cardFace cardFront"><h2>🎉 練習完成！</h2></div></div>`;
        return;
    }

    const word = deck[currentIndex];
    const frontWordEl = document.getElementById('frontWord');
    const frontTagEl = document.getElementById('frontTag');
    const backWordEl = document.getElementById('backWord');
    const backStatsEl = document.getElementById('backStats');

    // 恢復卡片初始外觀，準備下一張
    flashCard.classList.remove('isFlip');
    flashCard.style.transform = '';
    flashCard.style.opacity = '1';

    // 重置所有手勢遮罩透明度
    resetOverlays();

    // 填入中韓文內容
    if (frontWordEl) frontWordEl.textContent = word.zh;
    if (backWordEl) backWordEl.textContent = word.kr;

    // 自動判斷詞性並加上標籤
    if (frontTagEl) {
        frontTagEl.className = 'word-tag'; // 重置樣式
        if (word.zh.endsWith('的') || (word.kr.endsWith('다') && !word.kr.includes(' '))) {
            frontTagEl.textContent = '形容詞';
            frontTagEl.classList.add('tag-adj');
            frontTagEl.style.display = 'inline-block';
        } else if (word.zh.includes('開') || word.zh.includes('關') || word.kr.includes(' ')) {
            frontTagEl.textContent = '動 詞';
            frontTagEl.classList.add('tag-verb');
            frontTagEl.style.with = 'inline-block';
        } else {
            frontTagEl.style.display = 'none';
        }
    }

    // 顯示對錯統計戰績
    if (backStatsEl) {
        const cc = word.correct_count || 0;
        const wc = word.wrong_count || 0;
        backStatsEl.textContent = `戰績： O ${cc} 次 / X ${wc} 次`;
    }
}

// 輔助函式：重置所有手勢遮罩
function resetOverlays() {
    const overlays = document.querySelectorAll('.card-overlay');
    overlays.forEach(el => {
        if (el) el.style.opacity = '0';
    });
}

export async function answerCard(type) {
    const word = deck[currentIndex];
    if (!word) return;

    // 徹底確保欄位初始值是數字
    if (typeof word.correct_count !== 'number') word.correct_count = 0;
    if (typeof word.wrong_count !== 'number') word.wrong_count = 0;

    // 💥 這裡我們把 level 當作「上一次成功記憶的間隔天數 (預設0天)」
    if (typeof word.level !== 'number') word.level = 0;

    let nextIntervalDays = 1; // 下一次複習的間隔天數，預設明天複習

    if (type === 'known') {
        // 【右滑：熟悉】
        word.correct_count += 1;

        // 依照經典 SM-2 記憶曲線規律：
        if (word.level === 0) {
            nextIntervalDays = 1;  // 第一次答對，1天後複習
        } else if (word.level === 1) {
            nextIntervalDays = 4;  // 第二次答對，4天後複習
        } else {
            // 之後每次答對，時間間隔都放大 2.2 倍 (等比級數增加，例如 4 -> 9 -> 20 -> 44天)
            nextIntervalDays = Math.round(word.level * 2.2);
        }

        // 把這次的間隔天數記在 level 欄位，留給下一次計算用
        word.level = nextIntervalDays;

    } else if (type === 'weak') {
        // 【左滑：不熟】
        word.wrong_count += 1;
        word.level = 0;       // 忘記了，間隔天數重置
        nextIntervalDays = 1;  // 明天立刻重新複習

    } else if (type === 'unsure') {
        // 【下滑：不確定】
        word.wrong_count += 1;
        word.level = 0;       // 不確定，當作忘記重置
        nextIntervalDays = 1;  // 明天立刻重新複習
    }

    // 💥 精確計算下一次複習的日期時間
    word.next_review_at = new Date(Date.now() + (24 * 60 * 60 * 1000 * nextIntervalDays));

    console.log(`[科學記憶曲線] 單字: ${word.zh} | 下一次將在 ${nextIntervalDays} 天後複習`);

    try {
        await saveWordProgress(word);
        console.log(`✅ 資料庫同步成功!`);
    } catch (err) {
        console.error('❌ 寫入資料庫發生錯誤:', err);
    }

    currentIndex++;
    renderCurrentCard();
}

function speakKorean(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    } else {
        alert('您的瀏覽器不支援語音發音功能');
    }
}

export function attachCardEvents() {
    const flashCard = document.getElementById('flashCard');
    const ttsBtn = document.getElementById('ttsBtn');

    const overlayKnown = document.querySelector('.overlay-known');
    const overlayWeak = document.querySelector('.overlay-weak');
    const overlayUnsure = document.querySelector('.overlay-unsure');

    if (!flashCard) return;

    if (ttsBtn) {
        ttsBtn.onclick = (e) => {
            e.stopPropagation();
            const word = deck[currentIndex];
            if (word && word.kr) speakKorean(word.kr);
        };
    }

    flashCard.onclick = (e) => {
        if (e.target.closest('#ttsBtn')) return;
        flashCard.classList.toggle('isFlip');
    };

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    const threshold = 120;

    flashCard.onpointerdown = (e) => {
        if (e.target.closest('#ttsBtn')) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        flashCard.style.transition = 'none';
        flashCard.setPointerCapture(e.pointerId);
    };

    flashCard.onpointermove = (e) => {
        if (!isDragging) return;
        const moveX = e.clientX - startX;
        const moveY = e.clientY - startY;

        flashCard.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${moveX * 0.05}deg)`;

        resetOverlays();

        if (Math.abs(moveY) > Math.abs(moveX)) {
            if (moveY > 0 && overlayUnsure) {
                overlayUnsure.style.opacity = Math.min(moveY / threshold, 1);
            }
        } else {
            if (moveX > 0 && overlayKnown) {
                overlayKnown.style.opacity = Math.min(moveX / threshold, 1);
            } else if (moveX < 0 && overlayWeak) {
                overlayWeak.style.opacity = Math.min(Math.abs(moveX) / threshold, 1);
            }
        }
    };

    flashCard.onpointerup = (e) => {
        if (!isDragging) return;
        isDragging = false;
        flashCard.releasePointerCapture(e.pointerId);

        const moveX = e.clientX - startX;
        const moveY = e.clientY - startY;

        flashCard.style.transition = 'all 0.3s ease-out';

        if (Math.abs(moveY) > Math.abs(moveX) && moveY > threshold) {
            flashCard.style.transform = 'translateY(100vh)';
            flashCard.style.opacity = '0';
            setTimeout(() => answerCard('unsure'), 250);
        }
        else if (moveX > threshold) {
            flashCard.style.transform = 'translateX(100vw) rotate(30deg)';
            flashCard.style.opacity = '0';
            setTimeout(() => answerCard('known'), 250);
        }
        else if (moveX < -threshold) {
            flashCard.style.transform = 'translateX(-100vw) rotate(-30deg)';
            flashCard.style.opacity = '0';
            setTimeout(() => answerCard('weak'), 250);
        }
        else {
            flashCard.style.transform = '';
            resetOverlays();
        }
    };

    flashCard.onpointercancel = () => {
        isDragging = false;
        flashCard.style.transition = 'all 0.3s ease-out';
        flashCard.style.transform = '';
        resetOverlays();
    };
}