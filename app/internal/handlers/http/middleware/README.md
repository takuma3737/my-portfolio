# internal/http/middleware

目的: 各HTTPリクエストでCookieを検証し、`users` にUPSERTして `user_id` を `context` へ入れる。

実装タスク例:
1. `auth.go` を作成し、`AuthMiddleware(ver *auth.Verifier, repo UserRepo) func(http.Handler) http.Handler` を定義。
2. `r.Cookie("user-session")` を取得し、なければ `context` にユーザー無しのまま `next` へ。
3. Cookie検証OKなら `hash := ver.DeriveIdentifierHash(uid)` → `repo.UpsertUserByIdentifierHash(ctx, hash)` → `id` を取得。
4. `context` に `user_id` を格納して `next` へ。401が必要なエンドポイントは別途 `RequireAuth` デコレータで保護。

補助:
- `internal/http/contextutil` に `WithUserID/GetUserID/RequireAuth` を用意。

