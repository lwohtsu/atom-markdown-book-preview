@div:coverpage
@div:covernumber
2
@divend
# C#の基本中の基本を覚えよう
@divend

## 最初のプログラムを<br>書いてみよう
最初の一歩として、文字を表示するだけの簡単なプログラム（スクリプト）を書いてみましょう。ここではプログラムの内容そのものではなく、プロジェクトのつくり方からエディタの使い方までの手順を覚えてください。

### プロジェクトの中にスクリプトを追加しよう

#### プロジェクトの作成
Unityでプログラムを書くには、その前にいくつか作成しなければいけないものがあります。最初につくるのは**プロジェクト**です。プロジェクトはゲームに必要なプログラムや画像、音楽などのデータをまとめる容れ物です。

Unityエディタの起動時に表示される**ホーム画面**でプロジェクトを作成します。名前は「FirstLesson」とし、保存場所はどこでもいいのでとりあえず［ドキュメント］フォルダ（Macでは［書類］フォルダ）にしておきましょう。

@div:figure
![](img2/c2s1-2.png?svgimg=28.5,,25)
- ［NEW］をクリック
@divend

@div:figure
![](img2/c2s1-3.png?svgimg=28.5,,50)
- ［Project name］に「FirstLesson」と入力
- ［Location］でフォルダの保存場所を確認
- ［Create Project］をクリック
@divend
@div:cap プロジェクトの作成 @divend
---
#### Unityエディタの画面各部の名称

プロジェクトを作成すると、そのプロジェクトが開かれた状態でUnityエディタが起動します。ここで画面各部の名称と役割を簡単に説明しておきましょう。Windows版もMac版も画面はほとんど一緒ですが、Macではメニューバーはデスクトップの上部に表示されます。また、画面構成は使いやすいようにカスタマイズすることもできます（P.■■のコラムを参照）。

@div:figure
![](img2/c2s1-4.png?svgimg=28.5)
- タイトルバー／メニューバー／ツールバー
- ［Hierarchy］ウィンドウ
- ［Inspector］ウィンドウ
- ［Scene］ビュー／［Game］ビュー
- ［Project］ウィンドウ／［Console］ウィンドウ
- ステータスバー
@divend

|名前|働き
|--|--
|タイトルバー| 編集中のプロジェクトの名前などが表示される
|メニューバー| Unityエディタの機能を呼び出すメニューが配置されている
|ツールバー| 動作テストを実行するボタンなどが配置されている
|［Hierarchy］ウィンドウ| シーン上に配置されたゲームオブジェクトの一覧が表示される
|［Inspector］ウィンドウ| ゲームオブジェクトなどの設定を確認・変更する
|［Scene］ビュー |ゲームオブジェクトなどを配置する編集画面
|［Game］ビュー| 動作テスト中のゲームを表示する画面
|［Project］ウィンドウ| プロジェクトに含まれる各種ファイルが表示される
|［Console］ウィンドウ| エラーメッセージなどを表示する画面
|ステータスバー| 簡易的なエラーメッセージなどを一行で表示する

@div:cap
各部の名称と働き
@divend

#### シーンの保存
続いて行う作業は**シーン**の保存です。シーンというのは、簡単にいえばゲーム内の1画面のデータです。「タイトル画面」「ゲームメイン画面」「クリア画面」など必要に応じて追加できます。






シーンはプロジェクト作成時に自動作成されるので、「scene1」という名前で保存してみましょう。

@div:figure
![](img2/c2s1-6.png?svgimg=40,130,45)

- ［File］→［Save Scene］を選択

@divend

@div:figure
![](img2/c2s1-7.png?svgimg=35)

- 保存場所を確認
- ［ファイル名］に「scene1」と入力
- ［保存］をクリック

@divend

@div:figure
![](img2/c2s1-8.png?svgimg=50,130,15)

- タイトルバーにシーン名が表示される

@divend

@div:figure
![](img2/c2s1-8.png?svgimg=50,90,28,,-88)

- ［Projects］ウィンドウに「scene1」が表示される

@div:rcap
保存されたシーン
@divend
@divend



---
#### スクリプトの入力
開いたLesson1.csの中にはすでに何かが書かれています。それぞれの意味はあとで説明するので、とりあえず「Start () { }」の間に「Debug.Log ("ハロー");」と入力してみてください【コ連参照】。

###### Lesson1.cs
```csharp
using UnityEngine;
using System.Collections;

public class Lesson1 : MonoBehaviour {

    // Use this for initialization
    void Start () {
        Debug.Log ("ハロー");　★この行マーカー★
    }

    // Update is called once per frame
    void Update () {

    }
}
```

入力のときにまず注意してほしいのは、日本語入力システムをオフにして**半角英数字で入力**しないといけないという点です。日本語を入力するときだけオンにして、入力が終わったらすぐにオフにするくせを付けましょう。アルファベットの**大文字小文字**も間違えてはいけません。

色々と面倒ですが、MonoDevelopの入力中は**入力支援機能**が働くので、それをうまく使えば間違いを減らすことができます。

では、本を読みながら実際にやってみましょう。

@div:figure
![](img2/c2s1-24.png?svgimg=50,130,30,,-40)

- 「Deb」と入力
- 「Debug」と候補が表示されたら［Enter］キーを押す

@divend

@div:figure
![](img2/c2s1-26.png?svgimg=50,130,40,,-40)

- 「.l」まで入力
- ［↑］［↓］キーで「Log」を選んで［Enter］キーを押す

@divend

@div:figure
![](img2/c2s1-28.png?svgimg=50,130,40,,-40)

- 「("」と入力
- 全角に切り換えて「ハロー」と入力

@divend

@div:figure
![](img2/c2s1-29.png?svgimg=50,130,30,,-40)

- 半角に切り換えて「");」と入力

@div:cap 最初のスクリプトの入力 @divend
@divend



@div:column
#### Visual Studioが起動してしまうときは？
パソコンにVisual Studioがインストールされている場合、そちらが起動することがあります。それでスクリプトを編集しても問題ないのですが、MonoDevelopを使いたい場合は、Unityエディタのメニューから［Edit］→［Preferences］を選択し、［Unity Preferences］ダイアログボックスの［External Tools］で［MonoDevelop］を選択します。

@div:figure
![](img2/c2s1-21.png?svgimg=40,,40)

- ［MonoDevelop (built-in)］を選択

@div:rcap
スクリプトエディタの切り替え【/右キャプ】
@divend
@divend
@divend

---
うまく入力できましたか？　命令の最初の数文字を入力すると、MonoDevelopは一致する命令の候補リストを表示してくれましたね。目的のものを［↑］［↓］キーで選んで［Enter］か［Tab］キーを押せば、間違えずに入力できるのです。また、最後の「;（セミコロン）」を入力したときに、半角スペースの空け方などがそろうよう整形してくれます。逆らわずにうまく使いこなしてください。

入力が終わったらファイルを上書き保存しましょう。忘れやすいので、ショートカットキーの［Ctrl］＋［S］を覚えて、小まめに保存するくせをつけましょう。

@div:figure
![](img2/c2s1-30.png?svgimg=35,,50)

- ［File］→［Save］を選択

@div:cap スクリプトの上書き保存 @divend
@divend


#### スクリプトの実行
入力したスクリプトが正しく動くか、さっそくテストしてみましょう。Unityのスクリプトを動かしたいときは、Unityエディタで**再生モード（playmode）**に切り換えます。また、今回のスクリプトの結果は**［Console］ウィンドウ**に表示されるので、切り換えておきます。

@div:figure
![](img2/c2s1-31.png?svgimg=35,130,80)

- ［Console］ウィンドウのタブをクリック
- ［プレイ］ボタンをクリック

@divend

@div:figure
![](img2/c2s1-32.png?svgimg=50,130,40,,-85)

- ［Console］ウィンドウに「ハロー」と表示された

@div:cap スクリプトの実行 @divend
@divend

「ハロー」と表示されたら成功です。［プレイ］ボタンをもう一回押して、再生モードを終了してください。

#### エラーを探すコツ
うまく動きましたか？　動かなかった場合は何か間違えているかもしれません。その場合は［Console］ウィンドウを見直してみましょう。エラーの理由と場所を示すメッセージが表示されているはずです。

@div:figure
![](img2/c2s1-36.png?svgimg=50,130,25,,-85)
@div:cap スクリプトのエラーを示すメッセージ @divend
@divend

Unityがエラーの場所も検出できた場合は、**「ファイル名(行番号, 列番号)」**という形で場所を教えてくれます。エラーメッセージをダブルクリックすると、MonoDevelopでその行が表示されます。

また、MonoDevelopで入力した時点でエラーがわかることもあります。入力した文字をよく見てください。MonoDevelopはスクリプトが読みやすいよう色分け表示してくれるのですが、入力した**文字が赤くなっていませんか**？　これは間違いの指摘です。

@div:figure
![](img2/c2s1-40.png?svgimg=60,60,30,-35,-40)
![](img2/c2s1-39.png?svgimg=60,60,30,-35,-40)
@div:cap 正しい場合（左）と間違っている場合（右） @divend
@divend

@div:figure
![](img2/chap2zu-01.svg?svgimg=105)
![](img2/chap2zu-02.svg?svgimg=105)
![](img2/chap2zu-03.svg?svgimg=105)
@div:cap SVG図版テスト @divend
@divend
