# internal/config

目的: 環境変数から秘密鍵等を読み込み、アプリ全体で使い回す設定を提供する。

実装タスク例:
1. `config.go` を作成し、`type Config struct { CookieSecret []byte; IdentifierPepper []byte }` を定義する。
2. `Load() (Config, error)` を実装して `os.Getenv("COOKIE_SECRET")` と `os.Getenv("IDENTIFIER_PEPPER")` を読み、バリデーション（長さチェック等）する。
3. `main.go` で一度だけ `Load()` を呼び、DIする（handlers/middleware/usecasesへ渡す）。
4. 値はログに出さないこと（漏洩防止）。

