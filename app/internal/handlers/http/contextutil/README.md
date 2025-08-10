# internal/http/contextutil

目的: リクエストスコープのユーザーIDを `context.Context` に安全に出し入れするユーティリティを置く。

実装タスク例:
1. `context.go` を作成し、専用の非公開キー型 `type userKey struct{}` を定義。
2. `func WithUserID(ctx context.Context, id int64) context.Context` を実装。
3. `func GetUserID(ctx context.Context) (int64, bool)` を実装。
4. `func RequireAuth(next http.Handler) http.Handler` を実装（`GetUserID` がfalseなら401）。

