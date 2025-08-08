.PHONY: help generate sqlc oapi clean build run test

# デフォルトターゲット
help:
	@echo "利用可能なコマンド:"
	@echo "  generate  - sqlcとoapi-codegenを実行してコードを生成"
	@echo "  sqlc      - sqlcでデータベースコードを生成"
	@echo "  oapi      - oapi-codegenでAPIコードを生成"
	@echo "  clean     - 生成されたファイルを削除"
	@echo "  build     - アプリケーションをビルド"
	@echo "  run       - アプリケーションを実行"
	@echo "  test      - テストを実行"

# すべてのコード生成を実行
generate: sqlc oapi
	@echo "コード生成が完了しました"

# sqlcでデータベースコードを生成
sqlc:
	@echo "sqlcでデータベースコードを生成中..."
	sqlc generate

# oapi-codegenでAPIコードを生成
oapi:
	@echo "oapi-codegenでAPIコードを生成中..."
	oapi-codegen -package oapi -generate types,server,spec ../schema/openapi.yaml > internal/handlers/oapi/generated.go

# 生成されたファイルを削除
clean:
	@echo "生成されたファイルを削除中..."
	rm -rf internal/repositories/sqlc/*.go
	rm -f internal/handlers/oapi/generated.go

# アプリケーションをビルド
build:
	@echo "アプリケーションをビルド中..."
	go build -o bin/server ./cmd/server

# アプリケーションを実行
run:
	@echo "アプリケーションを実行中..."
	go run ./cmd/server

# テストを実行
test:
	@echo "テストを実行中..."
	go test ./...

# 開発環境セットアップ
setup:
	@echo "開発環境をセットアップ中..."
	go mod tidy
	@echo "必要なツールをインストール中..."
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install github.com/deepmap/oapi-codegen/v2/cmd/oapi-codegen@latest

# データベースマイグレーション（将来的に追加予定）
migrate-up:
	@echo "データベースマイグレーションを実行中..."
	# TODO: マイグレーションツールの実装

migrate-down:
	@echo "データベースマイグレーションをロールバック中..."
	# TODO: マイグレーションツールの実装

# 開発用サーバー起動（ホットリロード付き）
dev:
	@echo "開発サーバーを起動中..."
	# TODO: air等のホットリロードツールの設定
	go run ./cmd/server

# リンター実行
lint:
	@echo "リンターを実行中..."
	golangci-lint run

# フォーマット実行
fmt:
	@echo "コードをフォーマット中..."
	go fmt ./...
	goimports -w .

# 依存関係の更新
deps:
	@echo "依存関係を更新中..."
	go mod tidy
	go mod download