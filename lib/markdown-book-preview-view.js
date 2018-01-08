'use babel';

import File from 'atom';
import chokidar from 'chokidar';
import nodeStatic from 'node-static';
import http from 'http';
import path from 'path';

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
    if(_instance){
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
    // // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('markdown-book-preview');
    this.element.textContent = 'The MarkdownBookPreview package is Alive!' + _masterPath;
    this.startWebServer();
    //
    // // Create message element
    // const message = document.createElement('div');
    // message.textContent = 'The MarkdownBookPreview package is Alive! It\'s ALIVE!';
    // message.classList.add('message');
    // this.element.appendChild(message);
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
    if(this.server){
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
    if(this.server){
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
