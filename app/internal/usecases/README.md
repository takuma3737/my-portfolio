# internal/auth

目的: 署名付きCookieの検証と、`identifier_hash` の導出を担う小さなユースケース層。

実装タスク例:
1. `session.go` を作成し、`type Verifier struct { cfg config.Config }` を定義する。
2. `VerifyCookieValue(cookieValue string) (uid string, err error)` を実装。`uid.issuedAt.sig` をパースし、`HMAC-SHA256(uid+"."+issuedAt)` を検証。
3. `DeriveIdentifierHash(uid string) string` を実装。`sha256(uid + pepper)` を `hex` で返す（pepper は `cfg.IdentifierPepper`）。
4. 比較は定数時間比較（timing attack 回避）。

