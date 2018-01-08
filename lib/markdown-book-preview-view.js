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
    this.vsiframe.clientWidth = this.element.clientWidth;
    this.vsiframe.clientHeight = this.element.clientHeight;
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
      this.vsiframe.src = 'file://' + htmlfilepath;
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
      console.log("start MDBP server port 8080");
      this.server = http.createServer(function(request, response) {
        request.addListener('end', function() {
          staticserver.serve(request, response);
          console.log("request");
        }).resume();
      }).listen(8080);

    } catch (err) {
      console.log(err.message);
    }
  }

}
