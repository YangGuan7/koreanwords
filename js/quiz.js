// js/quiz.js
import { fetchData } from './firebase.js'; // 正確導入 fetchData 函數

// 使用 fetchData 函數來讀取資料
fetchData().then((data) => {
    console.log("讀取到的資料：", data);
    // 假設 data 是包含單字的物件，你可以在這裡處理並渲染測驗題目
    // 例如：
    const wordList = Object.keys(data); // 取得單字的鍵值陣列（例如：apple, run）

    // 隨便選擇一個單字並顯示其中文和韓文
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    const wordData = data[randomWord];

    console.log(`隨機選擇單字：${randomWord}`);
    console.log(`中文：${wordData.中文}, 韓文：${wordData.韓文}`);

    // 你可以把資料顯示到頁面上
    // 例如：
    document.body.innerHTML = `
        <p>單字: ${randomWord}</p>
        <p>中文: ${wordData.中文}</p>
        <p>韓文: ${wordData.韓文}</p>
    `;
}).catch((error) => {
    console.error("資料讀取錯誤：", error);
});
