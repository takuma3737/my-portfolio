// Zenn記事の型定義

export interface ZennFrontMatter {
  title: string;
  emoji: string;
  type: "tech" | "idea";
  topics: string[];
  published: boolean;
  published_at?: string;
}

export interface ZennArticle {
  title: string;
  emoji: string;
  type: "tech" | "idea";
  topics: string[];
  published: boolean;
  published_at?: string;
  date: string; // ファイル作成日
  slug: string; // ファイル名から生成
  path: string; // GitHubでのパス
  url: string; // Zennでの実際のURL
  content?: string; // 記事本文（必要な場合）
}

export interface GraphQLResponse {
  data?: {
    repository?: {
      object?: {
        entries?: Array<{
          name: string;
          type: string;
          object?: {
            text?: string;
          };
        }>;
      };
    };
  };
  errors?: Array<{
    message: string;
    path?: string[];
  }>;
}

export interface ApiResult<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

export interface GitHubConfig {
  token: string;
  username: string;
  repository: string;
}

export interface CacheEntry {
  data: ZennArticle[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}