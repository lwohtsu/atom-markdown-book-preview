'use babel';

import {File} from 'atom';
import chokidar from 'chokidar';
import nodeStatic from 'node-static';
import http from 'http';
import path from 'path';
import MarkdownBookPreviewConvert from './markdown-book-preview-convert';

// シングルトン
let _instance = null;
// ファイルパス格納用
let _masterPath = "";
// VivlioStyleモード
let _vsmode = false;
// Webサーバポート
const _webport = 8085;

export default class MarkdownBookPreviewView {
  // シングルトン化
  static instance(params = {}) {
    if (_instance === null) {
      _instance = new MarkdownBookPreviewView(params);
    }
    return _instance
  }
  // マスターパスをセット
  static setMasterPath(path) {
    _masterPath = path;
    // Webサーバーを起動
    if (_instance) {
      _instance.startWebServer();
    }
  }
  // VivlioStyleモードをセット
  static setVSmode(mode){
    _vsmode = mode;
  }
  // instanceを取得 ただしInstanceが生成されていなければnullを返す
  static getLivingInstance(){
    return _instance
  }

  // コンストラクタ
  constructor(params = {}) {
    if (_instance !== null) {
      throw new Error('please call instance()');
    }
    if (_instance === null) {
      _instance = this;
    }
    // console.log(params);
    this.masterID = params.editorID;
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('MDBP');
    // 表示用のiframeを追加
    this.vsiframe = document.createElement('iframe');
    this.vsiframe.id = 'vs-preview';
    this.element.appendChild(this.vsiframe);
    // this.vsiframe.clientWidth = this.element.clientWidth;
    // this.vsiframe.clientHeight = this.element.clientHeight;
    // this.element.textContent = 'The MarkdownBookPreview package is Alive!' + _masterPath;
    this.startWebServer();

    return _instance;
  }
  // Returns an object that can be retrieved when package is activated
  serialize() {
    return null;
  }
  // Tear down any state and detach
  destroy() {
    // this.element.remove();
    console.log("destroy");
    if (this.server) {
      console.log("server close");
      this.server.close();
      this.server = null;
    }
    if(this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
  // getElementとgetTitleがないとViewとして動作できない
  getElement() {
    return this.element;
  }
  getTitle() {
    return "MDBP: " + _masterPath;
  }

  // サーバーを起動
  startWebServer() {
    if (_masterPath === "") {
      atom.notifications.addInfo('ファイルパスがセットされていません');
      return;
    }
    // markdownからhtmlファイルを作成
    try{
      const htmlfilepath = MarkdownBookPreviewConvert.convertMarkdown(_masterPath);
      // iframeに読み込む
      this.setHTMLPathToIframe(htmlfilepath);
    } catch(err){
      atom.notifications.addError(err.message);
      return;
    }

    // 監視の準備
    this.watcher = chokidar.watch(_masterPath);
    // Markdownファイルが更新されたらHTMLを作り直してリロードする
    this.watcher.on('change', function(path) {
      console.log("markdown updated");
      const htmlfilepath = MarkdownBookPreviewConvert.convertMarkdown(_masterPath);
      MarkdownBookPreviewView.instance().vsiframe.contentDocument.location.reload(true);
    });

    // 起動済みのサーバーがあれば閉じる
    if (this.server) {
      console.log("server close");
      this.server.close();
      this.server = null;
    }
    // MDファイルの場所をホームディレクトリとしてサーバーを起動
    const homedir = path.dirname(_masterPath);
    try {
      const staticserver = new nodeStatic.Server(homedir, {
        cache: 0
      });
      console.log("start MDBP server port " + _webport);
      this.server = http.createServer(function(request, response) {
        request.addListener('end', function() {
          staticserver.serve(request, response);
          console.log("request");
        }).resume();
      }).listen(_webport);

    } catch (err) {
      console.log(err.message + err.fileName + err.lineNumber);
      this.serve.close;
      atom.notifications.addInfo('8085番サーバーの複数起動を検出しました。サーバーを終了して再度プレビューを開いてください');
    }
  }

  setHTMLPathToIframe(htmlfilepath){
    // vsmodeによってファイルを切り替える
    let url;
    if(_vsmode){
      url = 'http://localhost:' + _webport + '/viewer/vivliostyle-viewer.html#x=../' + path.basename(htmlfilepath);
    } else {
      url = 'http://localhost:' + _webport + '/' + path.basename(htmlfilepath);
    }
    // iframeのsrcを変更する
    this.vsiframe.src = '';
    this.vsiframe.src = url;
    // if(this.vsiframe.src){
    //   this.vsiframe.contentDocument.location.replace(path);
    // } else {
    //   this.vsiframe.src = path;
    // }
  }
}
