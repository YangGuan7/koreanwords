// pushData.js

import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { app } from './firebase.js';  // 引入 firebase.js 中的 app

const db = getDatabase(app);

// 資料結構
const words = {
    apple: {
        中文: "蘋果",
        韓文: "사과",
        詞性: "名詞",
        例句: "나는 사과를 좋아해요."
    },
    run: {
        中文: "跑步",
        韓文: "달리다",
        詞性: "動詞",
        例句: "나는 아침마다 달려요."
    },
    restaurant: {
        "中文": "餐廳",
        "韓文": "식당",
        "詞性": "名詞",
        "例句": "저는 식당에서 저녁을 먹어요."
    },
    doctor: {
        "中文": "醫生",
        "韓文": "의사",
        "詞性": "名詞",
        "例句": "저는 의사에게 가야 해요."
    },
    // 其他單字資料...
};

// 推送資料到 Firebase
const dbRef = ref(db, '單字');
set(dbRef, words)
    .then(() => {
        console.log("資料成功儲存！");
    })
    .catch((error) => {
        console.error("資料儲存失敗：", error);
    });
