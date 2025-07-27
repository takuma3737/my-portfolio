---
title: "Goでログマスキングを実現する方法"
date: 2025-07-27
emoji: "🔐"
tags: ["Go", "fmt", "マスキング", "Stringer"]
description: "Goでクレジットカード番号などの機密情報をPrint系の出力でマスキングする方法を解説します。"
draft: false
---

## はじめに

出力やログに機密情報を含めたくないと思ったことはありませんか？
Go はシンプルな方法で文字列出力時のマスキングを実現できます。

本記事では「**Go の Stringer インターフェースを利用したマスキングの方法**」を解説します。

## Go と Stringer インターフェース

`fmt`パッケージの関数は、値が[`fmt.Stringer`](https://pkg.go.dev/fmt#Stringer)を実装している場合、`String()`メソッドを自動的に呼び出します。これは`fmt.Print`系だけでなく、`fmt.Sprintf`や`fmt.Errorf`の`%s`、`%v`などでも同様です。

```go
type Stringer interface {
    String() string
}
```

この特性を利用してマスキングを実現することができます。

## 基本例：独自型に String()を実装

例えば、クレジットカード番号を持つ型を定義し、`String()` を実装すると次のようになります。

```go
type CreditCardNumber string

func (c CreditCardNumber) String() string {
    return "****-****-****-****"
}
```

```go
num := CreditCardNumber("4111-1111-1111-1111")
fmt.Println(num) // ****-****-****-****
```

## fmt.Errorf でも同様にマスキング

エラーメッセージでも同じようにマスキングされます：

```go
num := CreditCardNumber("4111-1111-1111-1111")
err := fmt.Errorf("処理エラー: %s", num)
fmt.Println(err) // 処理エラー: ****-****-****-****
```

## 構造体に含めた場合

次は構造体のフィールドにその型を含める例です。

```go
type CreditCardNumber string

func (c CreditCardNumber) String() string {
    return "****-****-****-****"
}

type CreditCard struct {
    Number   CreditCardNumber
    UserName string
}

c := CreditCard{
    Number:   "1999-2123-4531-1124",
    UserName: "tanaka",
}
fmt.Println(c) // {****-****-****-**** tanaka}
```

`fmt` は構造体の各フィールドを個別に出力する際、各フィールドが `Stringer` を実装していれば `String()` を呼び出すのでマスキングできます。


## 構造体自体に String()を実装する方法

より詳細な出力を控えたい場合は、構造体自体に `String()` を実装するとよいでしょう。

```go
func (c CreditCard) String() string {
    return fmt.Sprintf("num:%s,name:%s", c.Number, c.UserName)
}

fmt.Println(c) // num:****-****-****-****,name:tanaka
```

## まとめ

- `fmt`や`log`は`Stringer`を実装した型の`String()`を自動で呼び出す
- `Print*`系だけでなく、`%s`や`%v`を使う`Sprintf`、`Errorf`でもマスキングされる
- マスキングしたい値を含む型に`String()`を実装するだけで実現可能
- 構造体自体にも`String()`を実装すると、出力を完全に制御できる

これで Go でログマスキングを実現する基本はばっちりです。是非使ってみてください！ 🚀
