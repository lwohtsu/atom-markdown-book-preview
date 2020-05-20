'use babel';

import MarkdownBookPreviewView from './markdown-book-preview-view';
import {
  CompositeDisposable
} from 'atom';
import {
  TextEditor
} from 'atom';
import url from 'url';
import fs from 'fs';
import path from 'path';
import https from 'https';

export default {

  markdownBookPreviewView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    // this.markdownBookPreviewView = new MarkdownBookPreviewView(state.markdownBookPreviewViewState);
    // this.modalPanel = atom.workspace.addModalPanel({
    //   item: this.markdownBookPreviewView.getElement(),
    //   visible: false
    // });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'markdown-book-preview:toggle': () => this.toggle(),
      'markdown-book-preview:toggleVS': () => this.altToggleVS(), //toggleVS(),
      'markdown-book-preview:printPDF': () => this.printPDF(),
      'markdown-book-preview:exportXML': () => this.exportXML(),
      'markdown-book-preview:downloadTemplate': () => this.downloadTemplate('https://raw.githubusercontent.com/lwohtsu/atom-markdown-book-preview/master/booksample/', true),
      'markdown-book-preview:downloadTemplateA5V1': () => this.downloadTemplate('https://raw.githubusercontent.com/lwohtsu/atom-markdown-book-preview/master/booksample_a5v1/', true),
      'markdown-book-preview:downloadTemplateB5KZM': () => this.downloadTemplate('https://raw.githubusercontent.com/lwohtsu/atom-markdown-book-preview/master/booktemp_b5_kzm/', true, true, [
          'arrow.png',
          'cover.png',
          'h3_hd.svg',
          'hd2_tri.svg',
          'head.png'
      ]),
      'markdown-book-preview:downloadTemplateA5STM': () =>      this.downloadTemplate('https://raw.githubusercontent.com/lwohtsu/atom-markdown-book-preview/master/booktemp_a5_stm/', true, true, [
          'apron_man1-1smile.png',
          'apron_man1-4laugh.png',
          'apron_man2-1idea.png',
          'apron_man3-1question.png',
          'apron_woman1-1smile.png',
          'apron_woman1-4laugh.png',
          'apron_woman2-1idea.png',
          'apron_woman2-2shock.png',
          'apron_woman3-1question.png'
      ]),
      'markdown-book-preview:downloadTemplate46AKB': () =>      this.downloadTemplate('https://raw.githubusercontent.com/lwohtsu/atom-markdown-book-preview/master/booktemp_46tate_akb/', true)
    }));

    // カスタムオープナー
    atom.workspace.addOpener((uriToOpen) => {
      // console.log("custom opener");
      const {
        protocol,
        hash,
        host,
        pathname,
        // searchParams
      } = url.parse(uriToOpen);
      console.log(url.parse(uriToOpen));

      if (protocol === 'markdown-book-preview:') {
        // const view = new TextEditor();
        const view = MarkdownBookPreviewView.instance({
          editorID: hash.substring(1)
        });
        // view.setText("editorID");
        return view;
      }
    });
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.markdownBookPreviewView.destroy();
  },

  // serialize() {
  //   return {
  //     markdownBookPreviewViewState: this.markdownBookPreviewView.serialize()
  //   };
  // },

  // 生のHTMLで開く
  toggle(vsmode = false) {
    console.log('MarkdownBookPreview was toggled!');
    const editor = atom.workspace.getActiveTextEditor();
    if (this.checkEditorPath(editor) === false) return;
    // プレビューしたいパスやVSmodeを設定
    const mdpath = editor.getPath();
    console.log(mdpath);
    MarkdownBookPreviewView.setVSmode(vsmode);
    MarkdownBookPreviewView.setMasterPath(mdpath);
    // プレビューペインを開く、すでにビューのインスタンスが存在していればサーバ再起動
    // プレビューペインを開く
    atom.workspace.open(
      "markdown-book-preview://editor/#" + editor.id, {
        split: 'right'
      }
    );
    // const instance = MarkdownBookPreviewView.getLivingInstance();
    // if(instance === null){
    // } else{
    //   // サーバ再起動
    //   instance.startWebServer();
    // }
  },

  // Vivliostyleで開く
  toggleVS() {
    console.log('Vivliostyle Mode');
    this.toggle(true);
  },

  // Vivliostyleビューのリロードがうまくいかなくなったため、代替案を提示
  altToggleVS(){
      atom.notifications.addInfo('VS Previewは障害のために休止中です。代替としてHTML PreviewとPrint PDFによるプレビューを使用してください');
  },

  // 印刷用PDFを書き出すための処理
  printPDF() {
    console.log('MarkdownBookPreview print PDF');
    const instance = MarkdownBookPreviewView.getLivingInstance();
    if (instance !== null) {
      instance.openPrintPDFPath();
    }
  },

  // InDesign用のXMLを書き出す
  exportXML() {
    console.log('MarkdownBookPreview export XML');
    const instance = MarkdownBookPreviewView.getLivingInstance();
    if (instance !== null) {
      instance.exportInDesignXML();
    }
  },

  // テンプレートをダウンロードする
  // hasmnpはマニピュレートファイルも落とすかどうかのフラグ
  // hasSyntaxはシンタックスハイライト用に_vs.cssを落とすかどうかのフラグ
  // hasCSSImgはCSSが画像フォルダを持つかどうか
  downloadTemplate(baseurl, hasmnp = false, hasSyntax = false, CSSImg = []) {
    console.log('Template Downoading');
    const editor = atom.workspace.getActiveTextEditor();
    if (this.checkEditorPath(editor) === false) return;
    const workdir = path.dirname(editor.getPath());
    // _template.htmlをダウンロード
    const templatefile = path.join(workdir, '_template.html');
    if (fs.existsSync(templatefile) === false) {
      https.get(baseurl + '_template.html', (res) => {
        if (res.statusCode !== 200) return;
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          fs.writeFileSync(templatefile, rawData);
          atom.notifications.addInfo('_template.htmlをダウンロードしました');
        });
      });
    }
    // _template.htmlをダウンロード
    const replistfile = path.join(workdir, '_postReplaceList.json');
    if (fs.existsSync(replistfile) === false) {
      https.get(baseurl + '_postReplaceList.json', (res) => {
        if (res.statusCode !== 200) return;
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          fs.writeFileSync(replistfile, rawData);
          atom.notifications.addInfo('_postReplaceList.jsonをダウンロードしました');
        });
      });
    }
    // _cssフォルダを作成
    const cssdir = path.join(workdir, '_css');
    if (fs.existsSync(cssdir) === false) {
      fs.mkdirSync(cssdir);
    }
    // booksample.cssをダウンロード
    const samplecssfile = path.join(workdir, '_css', 'booksample.css');
    if (fs.existsSync(samplecssfile) === false) {
      https.get(baseurl + '_css/booksample.css', (res) => {
        if (res.statusCode !== 200) return;
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          fs.writeFileSync(samplecssfile, rawData);
          atom.notifications.addInfo('booksample.cssをダウンロードしました');
        });
      });
    }
    // 必要なら_postManipulate.jsonもダウンロード
    if(hasmnp){
        const mnpfile = path.join(workdir, '_postManipulate.json');
        // _cssフォルダ内にimgフォルダを作成
        const cssdir = path.join(workdir, '_css', 'img');
        if (fs.existsSync(cssdir) === false) {
          fs.mkdirSync(cssdir);
        }
        if (fs.existsSync(mnpfile) === false) {
            https.get(baseurl + '_postManipulate.json', (res) => {
              if (res.statusCode !== 200) return;
              let rawData = '';
              res.on('data', (chunk) => {
                rawData += chunk;
              });
              res.on('end', () => {
                fs.writeFileSync(mnpfile, rawData);
                atom.notifications.addInfo('_postManipulate.jsonをダウンロードしました');
              });
            });
        }
    }
    // 必要なら_vs.cssをダウンロード
    if(hasSyntax){
      const mnpfile = path.join(workdir, '_css', '_vs.css');
      if (fs.existsSync(mnpfile) === false) {
        https.get(baseurl + '_css/_vs.css', (res) => {
          if (res.statusCode !== 200) return;
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            fs.writeFileSync(mnpfile, rawData);
            atom.notifications.addInfo('_vs.cssをダウンロードしました');
          });
        });
      }
    }
    // 必要ならCSS用の画像をダウンロード
    if(CSSImg){
        for(let f of CSSImg){
            let mnpfile = path.join(workdir, '_css', 'img', f);
            if (fs.existsSync(mnpfile) === false) {
                https.get(baseurl + '_css/img/' + f, (res) => {
                  if (res.statusCode !== 200) return;
                  let rawData = [];
                  res.on('data', (chunk) => {
                    rawData.push(chunk);
                  });
                  res.on('end', () => {
                    fs.writeFileSync(mnpfile, Buffer.concat(rawData));
                    atom.notifications.addInfo(f + 'をダウンロードしました');
                  });
                });
            }
        }
    }
  },

  // チェック
  checkEditorPath(editor) {
    if (editor === null) return false;
    const path = editor.getPath();
    if (!path) {
      atom.notifications.addInfo('ファイルを保存してから実行してください');
      return false;
    }
    if (path.indexOf('.md') < 0) {
      atom.notifications.addInfo('Mardownファイルではありません');
      return false;
    }
    return true;
  }

};
