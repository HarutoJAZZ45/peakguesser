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
}

/** スコアを保存 */
export async function saveScore(
  userId: string,
  score: number,
  timeMs: number,
  correctMountainIds: string[]
): Promise<void> {
  if (!db) return;

  // scoresコレクションへの全履歴保存はランキング仕様変更に伴い廃止（コスト削減のため）

  // ユーザー統計を更新
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data();

  const updates: Record<string, unknown> = {
    totalGames: increment(1),
    totalCorrect: increment(score),
    collectedMountains: arrayUnion(...correctMountainIds),
    updatedAt: serverTimestamp(),
  };

  // ベストスコアの更新
  if (!data || score > (data.bestScore || 0)) {
    updates.bestScore = score;
  }
  if (!data || (score >= (data.bestScore || 0) && (data.bestTime === 0 || timeMs < data.bestTime))) {
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
