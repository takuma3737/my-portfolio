// GitHub GraphQL API経由でZenn記事を取得する機能

import matter from "gray-matter";
import type {
  ZennArticle,
  ZennFrontMatter,
  GraphQLResponse,
  ApiResult,
  GitHubConfig,
  CacheEntry,
} from "../types/zenn";

// 記事のキャッシュ
let articlesCache: CacheEntry | null = null;

/**
 * 環境変数からGitHub設定を取得
 */
function getGitHubConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.ZENN_GITHUB_USERNAME;
  const repository = process.env.ZENN_REPO_NAME;

  if (!token || !username || !repository) {
    console.error("❌ 必要な環境変数が設定されていません:", {
      GITHUB_TOKEN: token ? "✅" : "❌",
      ZENN_GITHUB_USERNAME: username ? "✅" : "❌",
      ZENN_REPO_NAME: repository ? "✅" : "❌",
    });
    return null;
  }

  return { token, username, repository };
}

/**
 * GitHub GraphQL APIでZenn記事を取得
 */
async function fetchZennArticlesFromGitHub(
  config: GitHubConfig,
): Promise<ZennArticle[]> {
  const query = `
    query GetZennArticles($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: "HEAD:articles") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  text
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    owner: config.username,
    name: config.repository,
  };

  try {
    console.log(`🔍 GitHub APIにリクエスト: ${config.username}/${config.repository}`);

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        "User-Agent": "Zenn-Portfolio-Integration/1.0",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: GraphQLResponse = await response.json();

    if (result.errors) {
      const errorMessages = result.errors.map((e) => e.message).join(", ");
      throw new Error(`GraphQL エラー: ${errorMessages}`);
    }

    const entries = result.data?.repository?.object?.entries || [];
    const articles: ZennArticle[] = [];

    console.log(`📁 articlesディレクトリから ${entries.length} 個のファイルを発見`);

    for (const entry of entries) {
      if (entry.type === "blob" && entry.name.endsWith(".md")) {
        try {
          const markdownContent = entry.object?.text || "";
          const { data: frontMatter } = matter(markdownContent);
          const frontMatterData = frontMatter as ZennFrontMatter;

          if (frontMatterData.published) {
            const slug = entry.name.replace(".md", "");
            const article: ZennArticle = {
              title: frontMatterData.title || "タイトル未設定",
              emoji: frontMatterData.emoji || "📝",
              type: frontMatterData.type || "tech",
              topics: Array.isArray(frontMatterData.topics)
                ? frontMatterData.topics
                : [],
              published: frontMatterData.published,
              published_at: frontMatterData.published_at,
              date: frontMatterData.published_at || "日付未設定",
              slug,
              path: `articles/${entry.name}`,
              url: `https://zenn.dev/${config.username}/articles/${slug}`,
            };

            articles.push(article);
            console.log(`✅ 記事を追加: ${article.title}`);
          } else {
            console.log(`⏸️ 未公開記事をスキップ: ${frontMatterData.title || entry.name}`);
          }
        } catch (parseError) {
          console.error(`❌ ファイル解析エラー (${entry.name}):`, parseError);
        }
      }
    }

    // 日付でソート（新しい順）
    articles.sort((a, b) => {
      const dateA = new Date(a.published_at || a.date).getTime();
      const dateB = new Date(b.published_at || b.date).getTime();
      return dateB - dateA;
    });

    console.log(`🎉 合計 ${articles.length} 件の公開済み記事を取得`);
    return articles;
  } catch (error) {
    console.error("❌ GitHub API エラー:", error);
    throw error;
  }
}

/**
 * Zenn記事を取得（メイン関数）
 */
export async function fetchZennArticles(): Promise<ApiResult<ZennArticle[]>> {
  try {
    console.log("🚀 Zenn記事取得を開始...");

    const config = getGitHubConfig();
    if (!config) {
      return {
        success: false,
        data: [],
        message: "環境変数の設定に問題があります",
        error: "GITHUB_TOKEN, ZENN_GITHUB_USERNAME, ZENN_REPO_NAME の設定を確認してください",
      };
    }

    const articles = await fetchZennArticlesFromGitHub(config);

    return {
      success: true,
      data: articles,
      message: `${articles.length} 件の記事を正常に取得しました`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    console.error("❌ Zenn記事取得エラー:", errorMessage);

    return {
      success: false,
      data: [],
      message: "記事の取得に失敗しました",
      error: errorMessage,
    };
  }
}

/**
 * Zenn記事を取得（キャッシュ付き）
 */
export async function fetchZennArticlesWithCache(
  ttl: number = 5 * 60 * 1000, // デフォルト: 5分
): Promise<ApiResult<ZennArticle[]>> {
  const now = Date.now();

  // キャッシュが有効かチェック
  if (articlesCache && now - articlesCache.timestamp < articlesCache.ttl) {
    console.log("💾 キャッシュから記事を取得");
    return {
      success: true,
      data: articlesCache.data,
      message: `キャッシュから ${articlesCache.data.length} 件の記事を取得`,
    };
  }

  // キャッシュが無効または存在しない場合は新規取得
  console.log("🔄 キャッシュが無効です。新しく記事を取得...");
  const result = await fetchZennArticles();

  // 成功した場合はキャッシュに保存
  if (result.success) {
    articlesCache = {
      data: result.data,
      timestamp: now,
      ttl,
    };
    console.log("💾 記事をキャッシュに保存しました");
  }

  return result;
}

/**
 * キャッシュをクリア
 */
export function clearZennCache(): void {
  articlesCache = null;
  console.log("🗑️ Zennキャッシュをクリアしました");
}