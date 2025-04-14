// js/firebase.js

// 這是 Firebase 的 CDN 版本，替代本地的模組引入
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyCdsh_YEEnd9wg0KFmwUZoSRFwHpC71eWI",
    authDomain: "koreanwords-6806a.firebaseapp.com",
    databaseURL: "https://koreanwords-6806a-default-rtdb.firebaseio.com",
    projectId: "koreanwords-6806a",
    storageBucket: "koreanwords-6806a.firebasestorage.app",
    messagingSenderId: "904220840251",
    appId: "1:904220840251:web:9671cd1854116f2227a71e",
    measurementId: "G-7H7K5C6VYF"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 初始化資料庫
const db = getDatabase(app);

// 抓取資料庫資料的函數
export function fetchData() {
    // 指定資料庫路徑（對應到 '單字' 節點）
    const dbRef = ref(db, '單字');

    // 讀取資料
    return get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            // 資料存在，返回資料
            return snapshot.val();
        } else {
            // 資料庫中沒有資料
            throw new Error("資料庫中沒有資料");
        }
    }).catch((error) => {
        console.error("資料庫讀取錯誤：", error);
        throw error;
    });
}

// 確保正確導出 app
export { app };
