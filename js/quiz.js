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

// 接收並過濾主題
export function startStudy(customDeck, selectedTheme = 'all') {
    let finalDeck = customDeck ? [...customDeck] : [...words];

    // 如果使用者有選特定主題，就用陣列的 filter 過濾
    if (selectedTheme !== 'all') {
        finalDeck = finalDeck.filter(word => word.theme === selectedTheme);
    }

    deck = finalDeck;
    currentIndex = 0;

    const flashCard = document.getElementById('flashCard');
    if (flashCard) {
        flashCard.classList.remove('hide');
        flashCard.style.transform = ''; // 確保重刷時卡片位置歸零
        flashCard.style.opacity = '1';
    }

    // 防呆：如果該主題剛好沒有任何單字，給個提示
    if (deck.length === 0) {
        if (flashCard) flashCard.innerHTML = `<div class="cardInner"><div class="cardFace cardFront"><h2>📭 這個主題目前沒單字喔！</h2></div></div>`;
        return;
    }

    renderCurrentCard();
    attachCardEvents();
}

// 渲染當前單字卡（包含練習完成後的「再次複習」按鈕邏輯）
export function renderCurrentCard() {
    const flashCard = document.getElementById('flashCard');
    if (!flashCard) return;

    // 💥 檢查是否所有單字都練習完了
    if (currentIndex >= deck.length) {
        // 💥 關鍵修正 1：移除卡片上的拖曳與翻面點擊事件，並將卡片的位置、角度與透明度「強制歸零回中央」！
        removeCardEvents();
        flashCard.style.transform = 'translate(0, 0) rotate(0deg)';
        flashCard.style.opacity = '1';
        flashCard.classList.remove('isFlip');

        flashCard.innerHTML = `
            <div class="cardInner">
                <div class="cardFace cardFront" style="display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 15px; width: 100%; height: 100%;">
                    <h2 style="margin: 0; font-size: 24px;">🎉 練習完成！</h2>
                    <p style="font-size: 14px; color: #666; margin: 0;">這輪的單字都滑完囉！</p>
                    <button id="retryBtn" style="
                        padding: 10px 25px; 
                        background: #ffde6a; 
                        border: none; 
                        border-radius: 20px; 
                        font-family: inherit; 
                        font-size: 16px; 
                        font-weight: bold; 
                        color: #333;
                        cursor: pointer; 
                        box-shadow: 0 4px 0 #e6c55f;
                        transition: transform 0.1s;
                        margin-top: 10px;
                        z-index: 999;
                    ">
                        <i class="fa-solid fa-rotate-right"></i> 再次複習
                    </button>
                </div>
            </div>
        `;

        // 💥 動態綁定「再次複習」按鈕的點擊事件
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            // 按下按鈕時的按壓反饋特效
            retryBtn.onpointerdown = (e) => {
                e.stopPropagation();
                retryBtn.style.transform = 'translateY(2px)';
            };
            retryBtn.onpointerup = (e) => {
                e.stopPropagation();
                retryBtn.style.transform = 'none';
            };

            retryBtn.onclick = (e) => {
                e.stopPropagation(); // 防止事件向上冒泡

                // 重新還原卡片原本的正反面 HTML 結構與發音按鈕
                flashCard.innerHTML = `
                    <button id="ttsBtn" class="tts-btn" aria-label="發音">
                        <i class="fa-solid fa-volume-high"></i>
                    </button>
                    <div class="card-overlay overlay-known"><i class="fa-regular fa-circle"></i></div>
                    <div class="card-overlay overlay-weak"><i class="fa-solid fa-xmark"></i></div>
                    <div class="card-overlay overlay-unsure"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <div class="cardInner">
                        <div class="cardFace cardFront">
                            <div class="word-tag" id="frontTag"></div>
                            <div class="word-text" id="frontWord">中文</div>
                            <div class="tap-hint">★ 點擊翻面 ★</div>
                        </div>
                        <div class="cardFace cardBack">
                            <div class="word-text" id="backWord">KR</div>
                            <div class="word-stats" id="backStats"></div>
                            <div class="tap-hint">★ 點擊翻回 ★</div>
                        </div>
                    </div>
                `;

                // 自動抓取當前畫面上選單的主題，無縫開啟同主題新局
                const themeSelect = document.getElementById('themeSelect');
                const selectedTheme = themeSelect ? themeSelect.value : 'all';

                // 重新初始化單字本，並會在裡面重新綁定 attachCardEvents()
                startStudy(getWords(), selectedTheme);
            };
        }
        return;
    }

    const word = deck[currentIndex];
    const frontWordEl = document.getElementById('frontWord');
    const frontTagEl = document.getElementById('frontTag');
    const backWordEl = document.getElementById('backWord');
    const backStatsEl = document.getElementById('backStats');

    // 重置卡片旋轉與透明度
    flashCard.classList.remove('isFlip');
    flashCard.style.transform = '';
    flashCard.style.opacity = '1';

    resetOverlays();

    if (frontWordEl) frontWordEl.textContent = word.zh;
    if (backWordEl) backWordEl.textContent = word.kr;

    // 建立雙標籤徽章 (直接吃資料庫的 category 與 theme)
    if (frontTagEl) {
        frontTagEl.className = 'word-tag';
        frontTagEl.innerHTML = '';

        let tagsHTML = '';
        if (word.category) {
            tagsHTML += `<span class="badge-cat" style="background:#ffde6a; color:#333; padding:2px 8px; margin-right:5px; border-radius:10px; font-size:12px; font-weight:bold;">${word.category}</span>`;
        }
        if (word.theme && word.theme !== '未分類') {
            tagsHTML += `<span class="badge-theme" style="background:#a0e7e5; color:#333; padding:2px 8px; border-radius:10px; font-size:12px; font-weight:bold;">${word.theme}</span>`;
        }

        frontTagEl.innerHTML = tagsHTML;
        frontTagEl.style.display = tagsHTML ? 'inline-block' : 'none';
    }

    if (backStatsEl) {
        const cc = word.correct_count || 0;
        const wc = word.wrong_count || 0;
        backStatsEl.textContent = `戰績： O ${cc} 次 / X ${wc} 次`;
    }
}

function resetOverlays() {
    const overlays = document.querySelectorAll('.card-overlay');
    overlays.forEach(el => {
        if (el) el.style.opacity = '0';
    });
}

export async function answerCard(type) {
    const word = deck[currentIndex];
    if (!word) return;

    if (typeof word.correct_count !== 'number') word.correct_count = 0;
    if (typeof word.wrong_count !== 'number') word.wrong_count = 0;
    if (typeof word.level !== 'number') word.level = 0;

    let nextIntervalDays = 1;

    if (type === 'known') {
        word.correct_count += 1;
        if (word.level === 0) {
            nextIntervalDays = 1;
        } else if (word.level === 1) {
            nextIntervalDays = 4;
        } else {
            nextIntervalDays = Math.round(word.level * 2.2);
        }
        word.level = nextIntervalDays;
    } else if (type === 'weak') {
        word.wrong_count += 1;
        word.level = 0;
        nextIntervalDays = 1;
    } else if (type === 'unsure') {
        word.wrong_count += 1;
        word.level = 0;
        nextIntervalDays = 1;
    }

    word.next_review_at = new Date(Date.now() + (24 * 60 * 60 * 1000 * nextIntervalDays));

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

// 清除卡片手動控制事件的防護機制
function removeCardEvents() {
    const flashCard = document.getElementById('flashCard');
    if (!flashCard) return;
    flashCard.onclick = null;
    flashCard.onpointerdown = null;
    flashCard.onpointermove = null;
    flashCard.onpointerup = null;
    flashCard.onpointercancel = null;
}

export function attachCardEvents() {
    const flashCard = document.getElementById('flashCard');
    const ttsBtn = document.getElementById('ttsBtn');

    const overlayKnown = document.querySelector('.overlay-known');
    const overlayWeak = document.querySelector('.overlay-weak');
    const overlayUnsure = document.querySelector('.overlay-unsure');

    if (!flashCard) return;

    // 先清除舊有的，確保不重複綁定
    removeCardEvents();

    if (ttsBtn) {
        ttsBtn.onclick = (e) => {
            e.stopPropagation();
            const word = deck[currentIndex];
            if (word && word.kr) speakKorean(word.kr);
        };
    }

    flashCard.onclick = (e) => {
        if (e.target.closest('#ttsBtn') || e.target.closest('#retryBtn')) return;
        flashCard.classList.toggle('isFlip');
    };

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    const threshold = 120;

    flashCard.onpointerdown = (e) => {
        if (e.target.closest('#ttsBtn') || e.target.closest('#retryBtn')) return;
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