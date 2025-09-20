🔧 準備フェーズ（タスク1-3）
1. 環境変数とAPIトークンの設定

GitHub Personal Access Token を作成（repo 権限付与）
.env.local に GITHUB_TOKEN を設定
Astroで環境変数を読み込む設定
2. 必要なライブラリのインストール

gray-matter: Markdownのfront-matter解析用
既存のAstroプロジェクトに追加
3. 型定義ファイルの作成

src/types/zenn.ts: ZennArticle、GraphQLResponse等の型
TypeScriptの型安全性確保
🚀 実装フェーズ（タスク4-7）
4. GitHub GraphQL API関数の実装

src/lib/github-api.ts: 記事取得メイン関数
一括取得でパフォーマンス最適化
front-matter解析とデータ変換
5. 記事一覧ページのタブUI実装

JavaScript/TypeScriptでタブ切り替え機能
「内部記事」「Zenn記事」の2タブ
アクセシビリティ対応

6. 内部記事表示コンポーネントの作成

既存のContent Collections表示ロジックを分離
タブ内で動作するよう調整
7. Zenn記事表示コンポーネントの作成

外部リンクカード形式
emoji、title、topics、日付表示
Zennサイトへの遷移リンク
✨ 統合・調整フェーズ（タスク8-10）
8. 記事一覧ページの統合とリファクタリング

全コンポーネントの統合
既存サイドバー（タグ一覧）の両タブ対応
9. エラーハンドリングとローディング状態の実装

API取得失敗時のフォールバック
ローディング表示
ユーザビリティ向上
10. レスポンシブデザインの調整

モバイル・タブレット・デスクトップ対応
既存デザインシステムとの一貫性確保
|yellow: 🤔 実装時の注意点：

ZennのGitHubリポジトリ名とユーザー名の確認が必要
API制限に配慮したキャッシュ戦略の検討
記事数が多い場合のページネーション対応