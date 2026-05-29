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

// 儲存單字進度（包含詞性與主題標籤防護）
export async function saveWordProgress(word) {
    const updateData = {
        id: word.id,
        user_id: PUBLIC_USER_ID,
        zh: word.zh,
        kr: word.kr,
        category: word.category,
        theme: word.theme || '未分類',
        level: word.level || 0,
        correct_count: word.correct_count || 0,
        wrong_count: word.wrong_count || 0,
        next_review_at: word.next_review_at
    };

    const { data, error } = await supabase
        .from('user_vocab_progress')
        .upsert(updateData, { onConflict: 'id' });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// 載入進度
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

// 一鍵將所有單字的學習進度全部歸零
export async function resetAllWordProgress() {
    const { data: words, error: fetchError } = await supabase
        .from('user_vocab_progress')
        .select('id')
        .eq('user_id', PUBLIC_USER_ID);

    if (fetchError) {
        console.error('抓取資料失敗，無法重置', fetchError);
        return;
    }

    const resetData = words.map(word => ({
        id: word.id,
        user_id: PUBLIC_USER_ID,
        level: 0,
        correct_count: 0,
        wrong_count: 0,
        next_review_at: null
    }));

    const { error: updateError } = await supabase
        .from('user_vocab_progress')
        .upsert(resetData, { onConflict: 'id' });

    if (updateError) {
        console.error('重置資料庫失敗', updateError);
    } else {
        console.log('🎉 所有單字記憶進度已成功清空歸零！');
        alert('進度已完全清空，可以重新開始囉！');
        window.location.reload();
    }
}