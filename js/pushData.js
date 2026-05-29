import { supabase } from './firebase.js';

const PUBLIC_USER_ID = 'public';

// 只抓資料庫現有單字
export async function initPublicWords() {
    const { data, error } = await supabase
        .from('user_vocab_progress')
        .select('*')
        .eq('user_id', PUBLIC_USER_ID)
        .order('id', { ascending: true });

    if (error) {
        console.error('抓取資料庫單字失敗', error);
        return [];
    }

    console.log('抓到單字完整資料:', data);
    return data || [];
}

// 💥 修正後的儲存函式（改用 id 來判斷 ON CONFLICT）
export async function saveWordProgress(word) {
    const updateData = {
        id: word.id,                           // 使用原有的 id 做主鍵對應
        user_id: PUBLIC_USER_ID,
        zh: word.zh,
        kr: word.kr,
        level: word.level || 0,
        correct_count: word.correct_count || 0,
        wrong_count: word.wrong_count || 0,
        next_review_at: word.next_review_at
    };

    // 💥 這裡把 onConflict 改為 'id'
    const { data, error } = await supabase
        .from('user_vocab_progress')
        .upsert(updateData, { onConflict: 'id' });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function loadWordProgress() {
    const { data, error } = await supabase
        .from('user_vocab_progress')
        .select('*')
        .eq('user_id', PUBLIC_USER_ID);

    if (error) {
        console.error('抓取進度失敗', error);
        return [];
    }

    return data || [];
}

// 💥 秘密武器：一鍵將所有單字的學習進度全部歸零
export async function resetAllWordProgress() {
    const PUBLIC_USER_ID = 'public';

    // 抓出目前所有的單字
    const { data: words, error: fetchError } = await supabase
        .from('user_vocab_progress')
        .select('id')
        .eq('user_id', PUBLIC_USER_ID);

    if (fetchError) {
        console.error('抓取資料失敗，無法重置', fetchError);
        return;
    }

    // 將所有單字的對錯、等級、複習時間全部洗白
    const resetData = words.map(word => ({
        id: word.id,
        user_id: PUBLIC_USER_ID,
        level: 0,
        correct_count: 0,
        wrong_count: 0,
        next_review_at: null // 複習時間清空，等同於全新的單字
    }));

    const { error: updateError } = await supabase
        .from('user_vocab_progress')
        .upsert(resetData, { onConflict: 'id' });

    if (updateError) {
        console.error('重置資料庫失敗', updateError);
    } else {
        console.log('🎉 所有單字記憶進度已成功清空歸零！');
        alert('進度已完全清空，可以重新開始囉！');
        window.location.reload(); // 自動重新整理網頁刷新畫面
    }
}