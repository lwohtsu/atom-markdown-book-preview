'use babel';

import MarkdownBookPreviewView from './markdown-book-preview-view';
import {
  CompositeDisposable
} from 'atom';
import {
  TextEditor
} from 'atom';
import url from 'url';

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
      'markdown-book-preview:toggle': () => this.toggle()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'markdown-book-preview:toggleVS': () => this.toggleVS()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'markdown-book-preview:printPDF': () => this.printPDF()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'markdown-book-preview:exportXML': () => this.exportXML()
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
    if(editor === null) return;
    const path = editor.getPath();
    if (!path) {
      atom.notifications.addInfo('ファイルを保存してから実行してください');
      return;
    }
    if (path.indexOf('.md') < 0) {
      atom.notifications.addInfo('Mardownファイルではありません');
      return;
    }
    // プレビューしたいパスやVSmodeを設定
    MarkdownBookPreviewView.setVSmode(vsmode);
    MarkdownBookPreviewView.setMasterPath(path);
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

  // VivlioStyleで開く
  toggleVS() {
    console.log('VivlioStyle Mode');
    this.toggle(true);
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
  }

};
