# Design Document

## Overview

記事のコメント・いいね機能を実装するため、既存の Astro サイトにバックエンド API（Go + PostgreSQL）を追加し、フロントエンドから API を呼び出す構成とする。いいね機能はローカルストレージで個人の状態を管理し、コメント機能は完全にサーバーサイドで管理する。

## Architecture

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Astro)       │◄──►│   (Go)          │◄──►│   (Neon)        │
│                 │    │                 │    │                 │
│ - 記事表示      │    │ - コメントAPI   │    │ - comments      │
│ - コメント投稿  │    │ - いいねAPI     │    │ - likes         │
│ - いいねボタン  │    │ - 管理者API     │    │                 │
│ - ローカル状態  │    │ - JWT認証       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術スタック

- **Frontend**: Astro + TypeScript + Tailwind CSS
- **Backend**: Go + net/http (標準ライブラリ)
- **API 定義**: OpenAPI 3.0 + oapi-codegen
- **Database**: Neon (Serverless PostgreSQL)
- **Query Builder**: sqlc (型安全な SQL 生成)
- **Authentication**: JWT (署名付きトークン)
- **Deployment**: Vercel (Frontend) + Railway/Render (Backend)
- **State Management**: LocalStorage (いいね状態・JWT)

## Project Structure

```
app/
├── go.mod
├── go.sum
├── main.go
├── sqlc.yaml                 # sqlc設定ファイル
├── schema/
│   └── openapi.yaml          # OpenAPI仕様（フロント・バックエンド共有）
├── internal/
│   ├── domain/
│   │   ├── comment.go        # Comment構造体・バリデーション
│   │   └── like.go           # Like構造体・バリデーション
│   ├── handlers/
│   │   ├── oapi/
│   │   │   └── generated.go  # oapi-codegenで生成されたコード
│   │   ├── converter.go      # OpenAPI型 ↔ Domain型の変換
│   │   ├── comment.go        # コメントAPI handlers
│   │   ├── like.go           # いいねAPI handlers
│   │   └── admin.go          # 管理者API handlers
│   ├── repositories/
│   │   ├── db/
│   │   │   ├── migrations/   # DBマイグレーションファイル
│   │   │   ├── queries/      # SQLクエリファイル（.sql）
│   │   │   │   ├── comments.sql
│   │   │   │   └── likes.sql
│   │   │   └── schema.sql    # テーブル定義
│   │   ├── sqlc/
│   │   │   ├── db.go         # sqlcで生成されたコード
│   │   │   ├── models.go     # sqlcで生成されたモデル
│   │   │   └── queries.sql.go # sqlcで生成されたクエリ
│   │   ├── database.go       # DB接続・設定
│   │   ├── comment.go        # コメントリポジトリ実装
│   │   └── like.go           # いいねリポジトリ実装
│   └── usecases/
│       ├── comment.go        # コメント処理ロジック
│       └── like.go           # いいね処理ロジック

front/
├── src/
│   ├── api/
│   │   ├── generated/        # OpenAPIから生成されたTypeScriptコード
│   │   └── client.ts         # API設定・共通処理
│   ├── components/
│   │   ├── CommentSection.astro
│   │   └── LikeButton.astro
│   ├── scripts/
│   │   ├── comments.ts       # コメント機能のクライアントサイドロジック
│   │   └── likes.ts          # いいね機能のクライアントサイドロジック
│   └── utils/
│       └── datetime.ts       # 日時フォーマット共通関数
```

## API Endpoints

JWT 認証と Upsert 操作に対応したエンドポイント：

```
POST   /api/auth/token                   - JWTトークン発行
GET    /api/articles/{slug}/comments     - コメント一覧取得
POST   /api/articles/{slug}/comments     - コメント投稿（JWT必須）
PUT    /api/comments/{id}                - コメント編集（JWT必須）
DELETE /api/comments/{id}                - コメント削除（JWT必須）
GET    /api/articles/{slug}/likes        - いいね数取得
POST   /api/articles/{slug}/likes/toggle - いいねトグル（JWT必須）
GET    /api/admin/comments               - 全コメント一覧（管理者のみ）
DELETE /api/admin/comments/{id}          - コメント削除（管理者のみ）
```

## Data Models

### Database Schema

#### comments テーブル

```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    article_slug VARCHAR(100) NOT NULL,
    author_name VARCHAR(50) DEFAULT '匿名',
    content TEXT NOT NULL,
    ip_address INET,
    user_identifier VARCHAR(255) NOT NULL, -- JWT内のユーザーID
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    deleted_at TIMESTAMP NULL
);
```

#### likes テーブル

```sql
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    article_slug VARCHAR(100) NOT NULL,
    user_identifier VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(article_slug, user_identifier) -- 同一ユーザーの重複いいねを防止
);
```

### Domain Models

```go
type Comment struct {
    ID             uint       `json:"id"`
    ArticleSlug    string     `json:"article_slug"`
    AuthorName     string     `json:"author_name"`
    Content        string     `json:"content"`
    UserIdentifier string     `json:"user_identifier"`
    CreatedAt      time.Time  `json:"created_at"`
    UpdatedAt      time.Time  `json:"updated_at"`
    DeletedAt      *time.Time `json:"-"`
}

type Like struct {
    ID             uint      `json:"id"`
    ArticleSlug    string    `json:"article_slug"`
    UserIdentifier string    `json:"user_identifier"`
    CreatedAt      time.Time `json:"created_at"`
}
```

## User Identification Strategy

匿名利用でもセキュリティを確保するため、署名付き JWT を使用：

1. **初回アクセス**: サーバーが署名付き JWT トークンを発行
2. **フロントエンド**: JWT をローカルストレージに保存
3. **API 呼び出し**: JWT を Authorization ヘッダーで送信
4. **バックエンド**: JWT 署名を検証してユーザー ID を取得

```go
// JWT発行（バックエンド）
func GenerateUserToken() (string, error) {
    userID := uuid.New().String()
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(time.Hour * 24 * 365).Unix(), // 1年有効
    })
    return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// JWT検証
func ValidateUserToken(tokenString string) (string, error) {
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
    })
    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        return claims["user_id"].(string), nil
    }
    return "", err
}
```

```typescript
// フロントエンドでのトークン管理
async function getUserToken(): Promise<string> {
  let token = localStorage.getItem("user_token");
  if (!token) {
    // 初回アクセス時にサーバーからトークンを取得
    const response = await fetch("/api/auth/token", { method: "POST" });
    const data = await response.json();
    token = data.token;
    localStorage.setItem("user_token", token);
  }
  return token;
}
```

## Database Operations Strategy

### いいね機能の Upsert 実装

重複いいねを防ぎ、データ整合性を保つため Upsert パターンを使用：

```sql
-- いいね追加（既存の場合は何もしない）
INSERT INTO likes (article_slug, user_identifier)
VALUES ($1, $2)
ON CONFLICT (article_slug, user_identifier) DO NOTHING;

-- いいね削除
DELETE FROM likes
WHERE article_slug = $1 AND user_identifier = $2;

-- いいね数取得
SELECT COUNT(*) FROM likes WHERE article_slug = $1;

-- ユーザーのいいね状態確認
SELECT EXISTS(
    SELECT 1 FROM likes
    WHERE article_slug = $1 AND user_identifier = $2
);
```

### コメント編集・削除のトランザクション

権限チェックとデータ更新を同一トランザクションで実行：

```sql
-- コメント編集（権限チェック付き）
BEGIN;
UPDATE comments
SET content = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2 AND user_identifier = $3 AND deleted_at IS NULL;
-- 更新行数が0の場合は権限なしまたは存在しない
COMMIT;

-- コメント削除（論理削除）
BEGIN;
UPDATE comments
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_identifier = $2 AND deleted_at IS NULL;
COMMIT;
```

## Code Generation

### OpenAPI Code Generation

**バックエンド（Go）:**

```bash
oapi-codegen -package oapi -generate types,server,spec schema/openapi.yaml > internal/handlers/oapi/generated.go
```

**フロントエンド（TypeScript）:**

```bash
npx @openapitools/openapi-generator-cli generate -i ../app/schema/openapi.yaml -g typescript-fetch -o src/api/generated
```

### sqlc Configuration

`sqlc.yaml`設定例：

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "internal/repositories/db/queries"
    schema: "internal/repositories/db/schema.sql"
    gen:
      go:
        package: "sqlc"
        out: "internal/repositories/sqlc"
        sql_package: "pgx/v5"
        emit_json_tags: true
        emit_prepared_queries: false
        emit_interface: false
        emit_exact_table_names: false
```

## Timezone and Date Formatting

### サーバーサイド（Go）

UTC で保存し、API レスポンスでは ISO8601 形式で返却：

```go
// JSON出力時は ISO8601 形式
func (c Comment) MarshalJSON() ([]byte, error) {
    type Alias Comment
    return json.Marshal(&struct {
        CreatedAt string `json:"created_at"`
        UpdatedAt string `json:"updated_at"`
        *Alias
    }{
        CreatedAt: c.CreatedAt.Format(time.RFC3339),
        UpdatedAt: c.UpdatedAt.Format(time.RFC3339),
        Alias:     (*Alias)(&c),
    })
}
```

### フロントエンド（TypeScript）

ISO8601 文字列を受け取り、JST 表示用にフォーマット：

```typescript
// front/src/utils/datetime.ts
export const DateTimeUtils = {
  formatJST: (isoString: string): string => {
    return new Date(isoString)
      .toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\//g, "年")
      .replace(/,/, " ");
  },

  formatRelative: (isoString: string): string => {
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "たった今";
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}時間前`;
    return DateTimeUtils.formatJST(isoString);
  },
};
```

## User Flow

### いいね機能のフロー

```
記事ページを開く
       ↓
JWT確認 → ローカルストレージ確認 → いいね状態復元
       ↓
API呼び出し → いいね数取得
       ↓
いいねボタン + いいね数表示
       ↓
┌─────────────────────────────────────┐
│ ユーザーがいいねボタンをクリック    │
└─────────────────────────────────────┘
       ↓
API: POST /likes/toggle (JWT付き)
       ↓
サーバー: JWT検証 → ユーザーID取得
       ↓
   未いいね？ ──Yes──→ DB: INSERT
       │                    ↓
       │              ローカルストレージ: 保存
       │                    ↓
       │           ボタン状態: いいね済み
       │
       └──No──→ DB: DELETE
                      ↓
         ローカルストレージ: 削除
                      ↓
           ボタン状態: 未いいね
```

### コメント編集・削除のフロー

```
コメント一覧表示
       ↓
JWT確認 → ユーザーID取得 → 自分のコメント？ ──Yes──→ 編集・削除ボタン表示
       │                                              ↓
       └──No──→ ボタン非表示                    ボタンクリック
                                                      ↓
                                              API呼び出し (JWT付き)
                                                      ↓
                                              サーバー: JWT検証 + 権限チェック
                                                      ↓
                                              トランザクション内でDB更新
                                                      ↓
                                              コメント一覧更新
```

## Error Handling

### Error Response Format

```json
{
  "error": true,
  "message": "エラーメッセージ",
  "code": "ERROR_CODE"
}
```

### Frontend Error Handling

- API 通信エラー時のユーザーフレンドリーなメッセージ表示
- JWT 期限切れ時の自動再取得
- ローカルストレージアクセスエラーのフォールバック
- フォームバリデーションエラーの表示

### Backend Error Handling

- JWT 検証エラーのハンドリング
- 入力値検証とサニタイゼーション
- データベース接続エラーのハンドリング
- レート制限超過時の適切なレスポンス
- CORS 設定とセキュリティヘッダー

## Testing Strategy

### Frontend Testing

- **Unit Tests**: コンポーネントの個別機能テスト
- **Integration Tests**: API 通信とローカルストレージの連携テスト
- **E2E Tests**: ユーザーフローの完全なテスト

### Backend Testing

- **Unit Tests**: 各 API エンドポイントの機能テスト
- **Integration Tests**: データベース操作の統合テスト
- **Load Tests**: 大量アクセス時の性能テスト

### Test Cases

1. JWT 認証フロー（発行・検証・期限切れ）
2. コメント投稿・編集・削除（権限チェック含む）
3. いいねボタンの状態変更（Upsert 動作）
4. ページリロード時の状態復元
5. スパム投稿の検出と拒否
6. 同時アクセス時のデータ整合性
