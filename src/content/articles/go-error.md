---
title: "Goのエラーハンドリング完全ガイド"
date: 2025-07-06
emoji: "☀️"
tags: ["Go", "エラーハンドリング", "バックエンド", "プログラミング"]
description: "Goにおけるエラーハンドリングの基礎から、errors、fmt、log、osパッケージの使い方、カスタムエラーの実装まで詳しく解説します。"
draft: false
---

# はじめに

Go で個人開発を行っていた際、エラーハンドリングに一貫性が無いことに気づいたため、改めてエラーハンドリングの基礎を学びました。
この記事では主に以下のパッケージを使用したエラーハンドリングとカスタムエラーについて紹介しますので、ご興味があれば一読ください！

- errors
- fmt
- log
- os

# errors

シンプルなエラーメッセージを持つオブジェクトを生成する。

```golang:main.go
package main

import (
	"errors"
	"fmt"
)

func divide(a, b int) (int, error) {
	err := errors.New("cannot divide by zero") //エラーメッセージを持つオブジェクトを作成

	if b == 0 {
		return 0, err
	}

	result := a / b
	return result, nil
}

func main() {

	result, err := divide(100, 0)
	if err != nil {
		fmt.Println(err) //"cannot divide by zero"と出力される
	} else {
		fmt.Println(result)
	}
}

```

```go:出力
出力
Cannot divide by zero
```

# fmt

ここでは fmt.Errorf()について解説する。
fmt.Sprintf()と同様に書式指定が可能となっている。

```golang:main.go
package main

import (
	"fmt"
)

func divide(a, b int) (int, error) {

	if b == 0 {
		err := fmt.Errorf("%vでは割れません。", b)
		return 0, err
	}

	result := a / b
	return result, nil
}

func main() {

	result, err := divide(100, 0)
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(result)
	}
}

```

```go:出力
0では割れません。
```

# log

log ではエラーメッセージや情報をログとして出力する。（log の出力先指定方法などは追々書いていく。）
log によるエラーハンドリングでは、エラー発生時に以下の動作に分けられる。

- プログラムを継続させる
- プログラムを終了させる

## プログラムの継続

log.Println()、log.Printf()、log.Sprintf()などが該当する。

```go:main.go
package main

import (
	"fmt"
	"log"
	"os"
)

func main() {

	file, err := os.Open("test.txt")
	if err != nil {
		log.Println(err)
	}

	defer file.Close()

	fmt.Println("エラー出ても実行されるよ")
}

```

```go:出力
出力
2024/09/17 21:18:52 open test.txt: no such file or directory
エラー出ても実行されるよ
```

## プログラムの終了

log.Fatal()、log.Fatalf()、log.Fatalln()が該当する。

```go:main.go
package main

import (
	"fmt"
	"log"
	"os"
)

func main() {

	file, err := os.Open("test.txt")
	if err != nil {
		log.Fatalln(err)
	}

	defer file.Close()

	fmt.Println("エラーが出たら実行されないよ")
}

```

```go:出力
出力
2024/09/17 21:19:55 open test.txt: no such file or directory
exit status 1
```

# os

ここでは os.Exit(code int)を紹介する。

```go:main.go
package main

import (
	"fmt"
	"os"
)

func main() {

	file, err := os.Open("test.txt")
	if err != nil {
		os.Exit(20)
	}

	defer file.Close()

	fmt.Println("エラー出たら実行されないよ")
}

```

```go:出力
出力
exit status 20

```

<details>
<summary>ステータスコードについて</summary>

- ステータスコードは 0~125 が推奨されている
- ステータスコードが 0 であることは、処理が正常に終了したことを示す
- ステータスコードが 1~125 ではエラーを示す
- ステータスコードの値は任意であり、エラーの種類(不正なフォーマット、認証失敗など)によりステタスコードを統一することでエラー改善をしやすくなる

参照元：https://pkg.go.dev/os#Exit

</details>

# カスタムエラー

Go ではエラーインターフェース(error)を満たすカスタムエラーを定義することで、より詳細なエラー情報を得ることができる。

```go:main.go
package main

import (
	"fmt"
)

type Myerror struct {
	code int
	msg  string
}

func (e *Myerror) Error() string {
	return fmt.Sprintf("エラーコード:%d,エラーメッセージ:%s", e.code, e.msg)

}

func main() {

	err := &Myerror{code: 404, msg: "ページが見つかりません"}
	fmt.Println(err.Error())
}

```

```go:出力
出力
エラーコード:404,エラーメッセージ:ページが見つかりません
```

# まとめ

今回の解説で取り上げた内容をまとめると以下のようになります。

- fmt.Errorf()
  fmt.Sprintf()のように書式指定が可能で、エラーメッセージを簡潔に作成できる。エラーを返す際に役立ちます。

- log パッケージ
  エラーや情報をログとして出力する際に使用します。log.Println()や log.Printf()などでプログラムを継続させつつエラーを記録でき、log.Fatal()を使うとエラーメッセージを表示しつつプログラムを強制終了させることが可能です。

- os.Exit()
  指定したステータスコードを返し、プログラムを終了します。正常終了には 0 を、エラー終了には 1~125 を使用します。

- カスタムエラー
  Go ではエラーインターフェースを満たすカスタムエラーを定義することで、エラーコードやメッセージを含む独自のエラーを作成できます。これにより、より詳細なエラーメッセージを提供しやすくなります。

以上を踏まえ、Go では状況に応じた適切なエラーハンドリング方法を選択することが重要です。ログの記録やエラー内容のカスタマイズを活用することで、問題発生時のトラブルシューティングがしやすくなり、プログラムの品質向上につながります。
