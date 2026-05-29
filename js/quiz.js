import { initPublicWords, saveWordProgress } from './pushData.js';

let words = [];
let deck = [];
let currentIndex = 0;

export async function initWords() {
    words = await initPublicWords();
    console.log('初始化抓到單字:', words); // 🔹 顯示資料庫單字
    deck = [...words];
    return words;
}

export function getWords() { return words; }

export function startStudy(customDeck) {
    deck = customDeck ? [...customDeck] : [...words];
    currentIndex = 0;
    renderCurrentCard();
    attachCardEvents();
}

export function renderCurrentCard() {
    const word = deck[currentIndex];
    if (!word) return;

    const frontWordEl = document.getElementById('frontWord');
    const backWordEl = document.getElementById('backWord');

    frontWordEl.textContent = word.zh;
    backWordEl.textContent = word.kr;
}

export async function answerCard(type) {
    const word = deck[currentIndex];
    if (!word) return;

    if (type === 'known') word.level = (word.level || 0) + 1;
    if (type === 'weak') word.level = Math.max((word.level || 0) - 1, 0);
    if (type === 'forgot') word.level = 0;

    word.next_review_at = new Date(Date.now() + (24 * 60 * 60 * 1000 * ((word.level || 1) * 2)));

    await saveWordProgress(word);

    console.log(`答題: ${type}`, word); // 🔹 顯示這次答題結果

    currentIndex++;
    renderCurrentCard();
}

export function attachCardEvents() {
    const flashCard = document.getElementById('flashCard');

    flashCard.addEventListener('click', () => flashCard.classList.toggle('isFlip'));

    let startX = 0, isDragging = false;
    flashCard.addEventListener('pointerdown', e => {
        isDragging = true; startX = e.clientX; flashCard.setPointerCapture(e.pointerId);
    });
    flashCard.addEventListener('pointerup', e => {
        if (!isDragging) return; isDragging = false;
        const moveX = e.clientX - startX;
        if (moveX > 100) { answerCard('known'); }
        else if (moveX < -100) { answerCard('forgot'); }
    });
}