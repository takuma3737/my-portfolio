// GitHub GraphQL API経由でZenn記事を取得する機能

import matter from "gray-matter";
import type {
  ZennArticle,
  ZennFrontMatter,
  GraphQLResponse,
  ApiResult,
  GitHubConfig,
  CacheEntry,
  GitHubTreeEntry,
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

  // デバッグ情報を詳細に出力
  console.log("🔍 環境変数デバッグ情報:");
  console.log("GITHUB_TOKEN:", token ? `設定済み (${token.length}文字)` : "❌ 未設定");
  console.log("ZENN_GITHUB_USERNAME:", username || "❌ 未設定");
  console.log("ZENN_REPO_NAME:", repository || "❌ 未設定");
  console.log("NODE_ENV:", process.env.NODE_ENV);

  if (!token || !username || !repository) {
    const missingVars = [];
    if (!token) missingVars.push("GITHUB_TOKEN");
    if (!username) missingVars.push("ZENN_GITHUB_USERNAME");
    if (!repository) missingVars.push("ZENN_REPO_NAME");
    
    console.error(`❌ 必要な環境変数が設定されていません: ${missingVars.join(", ")}`);
    return null;
  }

  return { token, username, repository };
}

/**
 * GitHub GraphQL APIでZenn記事を取得
 */
async function requestGitHubTree(
  config: GitHubConfig,
  expression: string,
): Promise<GitHubTreeEntry[]> {
  const query = `
    query GetZennDirectory($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
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
    expression,
  };

  console.log(`🔍 GitHub APIにリクエスト (expression: ${expression})`);

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
    const errorText = await response.text();
    console.error(`❌ GitHub API エラー: ${response.status} ${response.statusText}`);
    console.error(`レスポンス内容: ${errorText}`);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result: GraphQLResponse = await response.json();
  console.log(`✅ GitHub API レスポンス受信 (status: ${response.status})`);

  if (result.errors) {
    const errorMessages = result.errors.map((e) => e.message).join(", ");
    console.error(`❌ GraphQL エラー: ${errorMessages}`);
    throw new Error(`GraphQL エラー: ${errorMessages}`);
  }

  const treeObject = result.data?.repository?.object;

  if (!treeObject) {
    console.warn(`⚠️ 指定したパスにTreeが見つかりませんでした: ${expression}`);
    return [];
  }

  return treeObject.entries || [];
}

interface MarkdownFile {
  path: string;
  name: string;
  content: string;
}

async function fetchMarkdownFiles(
  config: GitHubConfig,
  directory: string = "articles",
): Promise<MarkdownFile[]> {
  const expression = `HEAD:${directory}`;
  const entries = await requestGitHubTree(config, expression);
  const markdownFiles: MarkdownFile[] = [];

  console.log(`📁 ${directory} から ${entries.length} 件のエントリを取得`);

  for (const entry of entries) {
    const entryPath = `${directory}/${entry.name}`;

    if (entry.type === "blob" && entry.name.toLowerCase().endsWith(".md")) {
      markdownFiles.push({
        path: entryPath,
        name: entry.name,
        content: entry.object?.text || "",
      });
      console.log(`📝 Markdownファイルを検出: ${entryPath}`);
    } else if (entry.type === "tree") {
      console.log(`📂 サブディレクトリを探索: ${entryPath}`);
      const nestedFiles = await fetchMarkdownFiles(config, entryPath);
      markdownFiles.push(...nestedFiles);
    } else {
      console.log(`ℹ️ 対象外のエントリをスキップ: ${entryPath}`);
    }
  }

  return markdownFiles;
}

async function fetchZennArticlesFromGitHub(
  config: GitHubConfig,
): Promise<ZennArticle[]> {
  try {
    console.log(
      `🔍 GitHub記事の探索を開始: ${config.username}/${config.repository}`,
    );

    const markdownFiles = await fetchMarkdownFiles(config);
    const articles: ZennArticle[] = [];

    console.log(`🗂️ 解析対象のMarkdownファイル数: ${markdownFiles.length}`);

    for (const file of markdownFiles) {
      try {
        const { data: frontMatter } = matter(file.content);
        const frontMatterData = frontMatter as ZennFrontMatter;

        if (frontMatterData.published) {
          const slug = file.name.replace(/\.md$/i, "");
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
            path: file.path,
            url: `https://zenn.dev/${config.username}/articles/${slug}`,
          };

          articles.push(article);
          console.log(`✅ 記事を追加: ${article.title} (${file.path})`);
        } else {
          console.log(`⏸️ 未公開記事をスキップ: ${frontMatterData.title || file.path}`);
        }
      } catch (parseError) {
        console.error(`❌ ファイル解析エラー (${file.path}):`, parseError);
      }
    }

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
      const missingVars = [];
      if (!process.env.GITHUB_TOKEN) missingVars.push("GITHUB_TOKEN");
      if (!process.env.ZENN_GITHUB_USERNAME) missingVars.push("ZENN_GITHUB_USERNAME");
      if (!process.env.ZENN_REPO_NAME) missingVars.push("ZENN_REPO_NAME");
      
      return {
        success: false,
        data: [],
        message: "環境変数の設定に問題があります",
        error: `以下の環境変数が設定されていません: ${missingVars.join(", ")}`,
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
  ttl: number = process.env.NODE_ENV === 'production' ? 2 * 60 * 1000 : 5 * 60 * 1000, // 本番: 2分, 開発: 5分
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
