import { supabase } from './firebase.js';

const PUBLIC_USER_ID = 'public';

// 只抓資料庫現有單字
export async function initPublicWords() {
    const { data, error } = await supabase
        .from('user_vocab_progress')
        .select('*')
        .eq('user_id', PUBLIC_USER_ID)
        .order('id', { ascending: true }); // 確保抓全部且有順序

    if (error) {
        console.error('抓取資料庫單字失敗', error);
        return [];
    }

    console.log('抓到單字完整資料:', data); // 🔹 log 所有資料
    return data || [];
}

export async function saveWordProgress(wordProgress) {
    return supabase
        .from('user_vocab_progress')
        .upsert({ ...wordProgress, user_id: PUBLIC_USER_ID }, { onConflict: ['user_id', 'zh', 'kr'] });
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