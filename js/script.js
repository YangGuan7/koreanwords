const defaultWords = [
    { zh: '亮的', ko: '밝다', roman: 'balg-da', category: '形容詞' },
    { zh: '暗的', ko: '어둡다', roman: 'eo-dub-da', category: '形容詞' },
    { zh: '高的', ko: '높다', roman: 'nop-da', category: '形容詞' },
    { zh: '矮的／低的', ko: '낮다', roman: 'nat-da', category: '形容詞' },
    { zh: '寬的', ko: '넓다', roman: 'neolb-da', category: '形容詞' },
    { zh: '窄的', ko: '좁다', roman: 'job-da', category: '形容詞' },
    { zh: '開燈', ko: '불을 켜다', roman: 'bu-reul kyeo-da', category: '動作' },
    { zh: '關燈', ko: '불을 끄다', roman: 'bu-reul kkeu-da', category: '動作' },
    { zh: '開門', ko: '문을 열다', roman: 'mu-neul yeol-da', category: '動作' },
    { zh: '關門', ko: '문을 닫다', roman: 'mu-neul dat-da', category: '動作' }
];

let words = loadWords();
let deck = [];
let currentIndex = 0;
let results = {
    known: [],
    weak: [],
    forgot: []
};
let voices = [];
let startX = 0;
let startY = 0;
let moveX = 0;
let isDragging = false;

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const frontMode = document.getElementById('frontMode');
const startPanel = document.getElementById('startPanel');
const finishPanel = document.getElementById('finishPanel');
const flashCard = document.getElementById('flashCard');
const stage = document.getElementById('stage');
const currentNum = document.getElementById('currentNum');
const totalNum = document.getElementById('totalNum');
const modeTitle = document.getElementById('modeTitle');
const modeDesc = document.getElementById('modeDesc');
const frontTag = document.getElementById('frontTag');
const backTag = document.getElementById('backTag');
const frontWord = document.getElementById('frontWord');
const frontSub = document.getElementById('frontSub');
const backWord = document.getElementById('backWord');
const backSub = document.getElementById('backSub');
const speakBtn = document.getElementById('speakBtn');
const bulkInput = document.getElementById('bulkInput');

function loadWords() {
    const saved = localStorage.getItem('korean_swipe_words');
    if (!saved) return [...defaultWords];

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length ? parsed : [...defaultWords];
    } catch (error) {
        return [...defaultWords];
    }
}

function saveWords() {
    localStorage.setItem('korean_swipe_words', JSON.stringify(words));
}

function getFilteredWords() {
    const keyword = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;

    return words.filter(item => {
        const matchKeyword = !keyword ||
            item.zh.toLowerCase().includes(keyword) ||
            item.ko.toLowerCase().includes(keyword) ||
            item.roman.toLowerCase().includes(keyword);

        const matchCategory = category === 'all' || item.category === category;
        return matchKeyword && matchCategory;
    });
}

function shuffleList(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function startStudy(customDeck) {
    deck = customDeck ? [...customDeck] : shuffleList(getFilteredWords());
    currentIndex = 0;
    results = { known: [], weak: [], forgot: [] };

    if (!deck.length) {
        alert('目前沒有可以練習的單字，請先新增或調整篩選條件。');
        return;
    }

    startPanel.classList.add('hide');
    finishPanel.classList.add('hide');
    flashCard.classList.remove('hide');
    modeTitle.textContent = '練習中';
    modeDesc.textContent = '左滑忘記、右滑記得，中間按鈕是不熟。';
    renderCurrentCard();
}

function renderCurrentCard() {
    const word = deck[currentIndex];

    if (!word) {
        finishStudy();
        return;
    }

    flashCard.classList.remove('isFlip');
    flashCard.style.transition = 'none';
    flashCard.style.transform = 'translateX(0) rotate(0deg)';
    flashCard.style.opacity = '1';

    requestAnimationFrame(() => {
        flashCard.style.transition = 'transform .2s ease, opacity .2s ease';
    });

    const frontIsZh = frontMode.value === 'zh';

    frontTag.textContent = word.category;
    backTag.textContent = '答案';

    frontWord.textContent = frontIsZh ? word.zh : word.ko;
    frontWord.className = frontIsZh ? 'zh' : 'ko';
    frontSub.textContent = frontIsZh ? '先想韓文怎麼說' : word.roman;

    backWord.textContent = frontIsZh ? word.ko : word.zh;
    backWord.className = frontIsZh ? 'ko' : 'zh';
    backSub.textContent = frontIsZh ? word.roman : '中文意思';

    currentNum.textContent = currentIndex + 1;
    totalNum.textContent = deck.length;
}

function finishStudy() {
    flashCard.classList.add('hide');
    finishPanel.classList.remove('hide');
    modeTitle.textContent = '練習完成';
    modeDesc.textContent = '這輪結果已整理好，可以再練不熟的字。';
    currentNum.textContent = deck.length;
    totalNum.textContent = deck.length;

    document.getElementById('knownCount').textContent = results.known.length;
    document.getElementById('weakCount').textContent = results.weak.length;
    document.getElementById('forgotCount').textContent = results.forgot.length;
}

function answerCard(type) {
    const word = deck[currentIndex];
    if (!word) return;

    results[type].push(word);

    const direction = type === 'known' ? 1 : type === 'forgot' ? -1 : 0;
    const move = direction === 0 ? 0 : direction * window.innerWidth;
    const rotate = direction * 18;

    if (type === 'weak') {
        flashCard.style.transform = 'translateY(18px) scale(.96)';
        flashCard.style.opacity = '.25';
    } else {
        flashCard.style.transform = `translateX(${move}px) rotate(${rotate}deg)`;
        flashCard.style.opacity = '.15';
    }

    setTimeout(() => {
        currentIndex += 1;
        renderCurrentCard();
    }, 220);
}

function speak(text) {
    if (!('speechSynthesis' in window)) {
        alert('你的瀏覽器不支援語音發音，可以改用 Chrome 試試看。');
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.88;
    utterance.pitch = 1;

    const koreanVoice = voices.find(voice => /ko-KR/i.test(voice.lang));
    if (koreanVoice) utterance.voice = koreanVoice;

    window.speechSynthesis.speak(utterance);
}

function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    voices = window.speechSynthesis.getVoices();
}

function parseBulkInput(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const parsed = [];
    const errors = [];

    lines.forEach((line, index) => {
        const parts = line.split('|').map(item => item.trim());
        if (parts.length < 4) {
            errors.push(`第 ${index + 1} 行格式不對：${line}`);
            return;
        }

        const [zh, ko, roman, category] = parts;
        if (!zh || !ko || !roman || !category) {
            errors.push(`第 ${index + 1} 行有欄位是空的：${line}`);
            return;
        }

        parsed.push({ zh, ko, roman, category });
    });

    return { parsed, errors };
}

function updateTotalPreview() {
    const count = getFilteredWords().length;
    if (flashCard.classList.contains('hide') && finishPanel.classList.contains('hide')) {
        totalNum.textContent = count;
        currentNum.textContent = 0;
    }
}

flashCard.addEventListener('click', event => {
    if (event.target.closest('#speakBtn')) return;
    if (Math.abs(moveX) > 8) return;
    flashCard.classList.toggle('isFlip');
});

flashCard.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        flashCard.classList.toggle('isFlip');
    }
});

flashCard.addEventListener('pointerdown', event => {
    if (event.target.closest('#speakBtn')) return;
    isDragging = true;
    moveX = 0;
    startX = event.clientX;
    startY = event.clientY;
    flashCard.setPointerCapture(event.pointerId);
    flashCard.style.transition = 'none';
});

flashCard.addEventListener('pointermove', event => {
    if (!isDragging) return;

    moveX = event.clientX - startX;
    const moveY = event.clientY - startY;
    const rotate = moveX / 18;
    flashCard.style.transform = `translate(${moveX}px, ${moveY * .12}px) rotate(${rotate}deg)`;
});

flashCard.addEventListener('pointerup', event => {
    if (!isDragging) return;
    isDragging = false;
    flashCard.releasePointerCapture(event.pointerId);
    flashCard.style.transition = 'transform .2s ease, opacity .2s ease';

    if (moveX > 110) {
        answerCard('known');
        return;
    }

    if (moveX < -110) {
        answerCard('forgot');
        return;
    }

    flashCard.style.transform = 'translateX(0) rotate(0deg)';
});

document.getElementById('startBtn').addEventListener('click', () => startStudy());
document.getElementById('restartBtn').addEventListener('click', () => startStudy());
document.getElementById('knownBtn').addEventListener('click', () => answerCard('known'));
document.getElementById('weakBtn').addEventListener('click', () => answerCard('weak'));
document.getElementById('forgotBtn').addEventListener('click', () => answerCard('forgot'));

speakBtn.addEventListener('click', event => {
    event.stopPropagation();
    const word = deck[currentIndex];
    if (word) speak(word.ko);
});

document.getElementById('shuffleBtn').addEventListener('click', () => {
    if (!deck.length || flashCard.classList.contains('hide')) {
        startStudy();
        return;
    }
    deck = shuffleList(deck.slice(currentIndex));
    currentIndex = 0;
    renderCurrentCard();
});

document.getElementById('practiceWeakBtn').addEventListener('click', () => {
    const weakDeck = [...results.weak, ...results.forgot];
    if (!weakDeck.length) {
        alert('目前沒有不熟或忘記的單字。');
        return;
    }
    startStudy(shuffleList(weakDeck));
});

document.getElementById('resetDefaultBtn').addEventListener('click', () => {
    words = [...defaultWords];
    saveWords();
    searchInput.value = '';
    categoryFilter.value = 'all';
    frontMode.value = 'zh';
    startPanel.classList.remove('hide');
    finishPanel.classList.add('hide');
    flashCard.classList.add('hide');
    modeTitle.textContent = '準備開始';
    modeDesc.textContent = '像刷卡片一樣，一次只專心記一個字。';
    updateTotalPreview();
});

document.getElementById('addWordsBtn').addEventListener('click', () => {
    const { parsed, errors } = parseBulkInput(bulkInput.value);

    if (errors.length) {
        alert('有幾行格式不對：\n\n' + errors.join('\n'));
        return;
    }

    if (!parsed.length) {
        alert('請先輸入要加入的單字。');
        return;
    }

    words = [...words, ...parsed];
    saveWords();
    bulkInput.value = '';
    updateTotalPreview();
    alert('已加入單字卡。');
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (!confirm('確定要清空全部單字嗎？')) return;
    words = [];
    deck = [];
    saveWords();
    startPanel.classList.remove('hide');
    finishPanel.classList.add('hide');
    flashCard.classList.add('hide');
    updateTotalPreview();
});

searchInput.addEventListener('input', updateTotalPreview);
categoryFilter.addEventListener('change', updateTotalPreview);
frontMode.addEventListener('change', () => {
    if (!flashCard.classList.contains('hide')) renderCurrentCard();
});

window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices);
loadVoices();
updateTotalPreview();