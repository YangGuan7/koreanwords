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

    if (currentIndex >= deck.length) {
        flashCard.innerHTML = `<div class="cardInner"><div class="cardFace cardFront"><h2>🎉 練習完成！</h2></div></div>`;
        return;
    }

    const word = deck[currentIndex];
    const frontWordEl = document.getElementById('frontWord');
    const frontTagEl = document.getElementById('frontTag'); // 💥 新增取得標籤元素
    const backWordEl = document.getElementById('backWord');

    flashCard.classList.remove('isFlip');
    flashCard.style.transform = '';
    flashCard.style.opacity = '1';

    resetOverlays();

    // 填入中韓文內容
    frontWordEl.textContent = word.zh;
    backWordEl.textContent = word.kr;

    // 💥 自動判斷詞性並加上標籤
    if (frontTagEl) {
        frontTagEl.className = 'word-tag'; // 先重置 class

        // 判斷法 1：根據中文結尾是否有「的」通常是形容詞
        // 判斷法 2：或者根據韓文有沒有空格/來判斷是動作還是狀態
        if (word.zh.endsWith('的') || (word.kr.endsWith('다') && !word.kr.includes(' '))) {
            // 這邊以你的資料庫前 6 筆（亮的、暗的、高的...）為例，符合形容詞
            frontTagEl.textContent = '形容詞';
            frontTagEl.classList.add('tag-adj');
            frontTagEl.style.display = 'inline-block';
        } else if (word.zh.includes('開') || word.zh.includes('關') || word.kr.includes(' ')) {
            // 後 4 筆（開燈、關門...）有動作特徵，符合動詞/動詞片語
            frontTagEl.textContent = '動 詞';
            frontTagEl.classList.add('tag-verb');
            frontTagEl.style.display = 'inline-block';
        } else {
            // 如果資料庫有其他不符合的，先隱藏標籤
            frontTagEl.style.display = 'none';
        }
    }
}

// 輔助函式：重置所有遮罩
function resetOverlays() {
    const overlays = document.querySelectorAll('.card-overlay');
    overlays.forEach(el => el.style.opacity = '0');
}

export async function answerCard(type) {
    const word = deck[currentIndex];
    if (!word) return;

    if (type === 'known') {
        word.level = (word.level || 0) + 1;
    } else if (type === 'weak') {
        word.level = Math.max((word.level || 0) - 1, 0);
    } else if (type === 'unsure') {
        word.level = 0;
    }

    word.next_review_at = new Date(Date.now() + (24 * 60 * 60 * 1000 * ((word.level || 1) * 2)));

    await saveWordProgress(word);
    console.log(`答題: ${type}`, word);

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

    // 取得三個圖示元素
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
    const threshold = 120; // 判定門檻

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

        // 卡片跟隨手指移動與旋轉
        flashCard.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${moveX * 0.05}deg)`;

        // 先重置透明度
        resetOverlays();

        // 動態計算手勢強度的透明度 (最高到 1)
        if (Math.abs(moveY) > Math.abs(moveX)) {
            // 上下移動為主
            if (moveY > 0 && overlayUnsure) {
                // 下滑：顯示不確定三角形
                overlayUnsure.style.opacity = Math.min(moveY / threshold, 1);
            }
        } else {
            // 左右移動為主
            if (moveX > 0 && overlayKnown) {
                // 右滑：顯示熟悉圈圈
                overlayKnown.style.opacity = Math.min(moveX / threshold, 1);
            } else if (moveX < 0 && overlayWeak) {
                // 左滑：顯示不熟叉叉
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

        // 判斷手勢終點
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
            // 沒過門檻，彈回並淡出圖示
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