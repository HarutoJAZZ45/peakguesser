import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ScoreRecord {
  id?: string;
  userId: string;
  displayName: string;
  score: number;
  timeMs: number;
  playedAt: Date;
}

export interface UserProfile {
  displayName: string;
  photoURL: string | null;
  totalGames: number;
  totalCorrect: number;
  bestScore: number;
  bestTime: number;
  collectedMountains: string[];
  /** 山ごとの正解回数 { mountainId: correctCount } */
  mountainCorrectCounts?: Record<string, number>;
  /** 出題されたことがある山のID一覧 */
  attemptedMountains?: string[];
}

/**
 * スコアを保存（1回のFirestore書き込みのみ）
 * cachedBestScore/cachedBestTime を使って getDoc を省略し高速化
 */
export async function saveScore(
  userId: string,
  score: number,
  timeMs: number,
  correctMountainIds: string[],
  allQuizMountainIds: string[],
  cachedBestScore: number,
  cachedBestTime: number,
): Promise<void> {
  if (!db) return;

  const userRef = doc(db, 'users', userId);

  const updates: Record<string, unknown> = {
    totalGames: increment(1),
    totalCorrect: increment(score),
    updatedAt: serverTimestamp(),
  };

  // 出題された山をすべて attemptedMountains に追加
  if (allQuizMountainIds.length > 0) {
    updates.attemptedMountains = arrayUnion(...allQuizMountainIds);
  }

  // 正解した山を collectedMountains に追加（後方互換）
  if (correctMountainIds.length > 0) {
    updates.collectedMountains = arrayUnion(...correctMountainIds);
  }

  // 正解した山ごとの正解回数をインクリメント（ドット記法でネストフィールドを更新）
  for (const id of correctMountainIds) {
    updates[`mountainCorrectCounts.${id}`] = increment(1);
  }

  // ベストスコアの更新（キャッシュされた値で比較 → getDoc 不要）
  if (score > cachedBestScore) {
    updates.bestScore = score;
  }
  if (score >= cachedBestScore && (cachedBestTime === 0 || timeMs < cachedBestTime)) {
    updates.bestTime = timeMs;
  }

  await updateDoc(userRef, updates);
}

/** ランキング取得（ユーザーごとのベストスコアでスコア降順 → タイム昇順） */
export async function getRanking(topN = 50): Promise<ScoreRecord[]> {
  if (!db) return [];

  try {
    // 複合インデックスエラーを避け、かつユーザーの重複を防ぐため、usersコレクションから取得
    const q = query(
      collection(db, 'users'),
      orderBy('bestScore', 'desc'),
      limit(topN)
    );

    const snap = await getDocs(q);
    const records = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: d.id, // usersコレクションのドキュメントIDがuserId
        displayName: data.displayName || '名無し',
        score: data.bestScore || 0,
        timeMs: data.bestTime || 0,
        playedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    // スコアが0のユーザー（未プレイ）を除外
    const filtered = records.filter(r => r.score > 0);

    // メモリ上で、スコアが同じならタイム昇順でソートする
    return filtered.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeMs - b.timeMs;
    });
  } catch (err) {
    console.error("Failed to get ranking:", err);
    return [];
  }
}

/** ユーザープロフィール取得 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) return null;
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

/** ユーザー名を更新 */
export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { displayName, updatedAt: serverTimestamp() });
}
