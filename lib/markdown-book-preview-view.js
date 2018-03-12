'use babel';

// import {File} from 'atom';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import nodeStatic from 'node-static';
import http from 'http';
import MarkdownBookPreviewConvert from './markdown-book-preview-convert';
import {shell} from 'electron';

// シングルトン
let _instance = null;
// ファイルパス格納用
let _masterPath = "";
let _homePath = "";
// VivlioStyleモード
let _vsmode = false;
// Webサーバポート
const _webport = 8085;
//
let _staticserver = null;

export default class MarkdownBookPreviewView {
  // シングルトン化
  static instance(params = {}) {
    if (_instance === null) {
      _instance = new MarkdownBookPreviewView(params);
    }
    return _instance
  }
  // マスターパスをセット
  static setMasterPath(mpath) {
    _masterPath = mpath;
    _homePath = path.dirname(mpath);
    //グループモード
    // （_home.pathファイルがあればWebサーバーのホームディレクトリを変える）
    if(fs.existsSync(path.join(_homePath, '_home.path')) === true ){
      const hpath = fs.readFileSync(path.join(_homePath, '_home.path'), 'utf-8');
      _homePath = path.dirname(path.resolve(_homePath, hpath));
      console.log('group mode ' + _homePath);
      const bname = path.relative(_homePath, _masterPath);
      console.log('bname is ' + bname);
    }
    // Webサーバーを起動
    if (_instance) {
      _instance.startWebServer();
    }
  }
  // VivlioStyleモードをセット
  static setVSmode(mode) {
    _vsmode = mode;
  }
  // instanceを取得 ただしInstanceが生成されていなければnullを返す
  static getLivingInstance() {
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
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    delete this.previousHome;
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

    // サーバーを作成
    this.createServer();

    // markdownからhtmlファイルを作成
    try {
      const htmlfilepath = MarkdownBookPreviewConvert.convertMarkdown(_masterPath, _homePath);
      // iframeに読み込む
      this.setHTMLPathToIframe(htmlfilepath);
    } catch (err) {
      atom.notifications.addError(err.message);
      return;
    }

    // 監視の準備
    this.watcher = chokidar.watch(_masterPath);
    // Markdownファイルが更新されたらHTMLを作り直してリロードする
    this.watcher.on('change', function(path) {
      console.log("markdown updated");
      const htmlfilepath = MarkdownBookPreviewConvert.convertMarkdown(_masterPath, _homePath);
      MarkdownBookPreviewView.instance().vsiframe.contentDocument.location.reload(true);
    });
  }

  createServer(){
    // 起動済みのサーバーがある？
    if (this.server) {
      // すでに同じホームディレクトリでサーバ起動済みであれば
      if(this.previousHome){
        if(this.previousHome === _homePath){
          return;
        }
      }
      // そうでなければサーバを終了して作り直す
      console.log("server close");
      this.server.close();
      this.server = null;
      MarkdownBookPreviewView._staticserver = null;
    }
    // MDファイルの場所をホームディレクトリとしてサーバーを起動
    const homedir = _homePath;
    this.previousHome = homedir;
    try {
      MarkdownBookPreviewView._staticserver = new nodeStatic.Server(homedir, {
        cache: 0
      });
      console.log("start MDBP server port " + _webport + ' home ' + homedir);
      this.server = http.createServer(function(request, response) {
        if (response.statusCode !== 200) {
          atom.notifications.addError('server error ' + response.statusCode);
          return;
        }
        request.addListener('end', function() {
          MarkdownBookPreviewView._staticserver.serve(request, response);
          console.log("request");
        }).resume();
      }).listen(_webport);

    } catch (err) {
      console.log(err.message + err.fileName + err.lineNumber);
      this.serve.close;
      atom.notifications.addInfo('8085番サーバーの複数起動を検出しました。サーバーを終了して再度プレビューを開いてください');
    }
  }

  setHTMLPathToIframe(htmlfilepath) {
    if (_vsmode === true) {
      // VivlioStyleビューワーの存在チェック
      const vspath = path.join(_homePath, 'viewer', 'vivliostyle-viewer.html');
      console.log(vspath);
      if (fs.existsSync(vspath) === false) {
        atom.notifications.addInfo(
          'VivlioStyle Viewerが見つかりません。ダウンロードして作業フォルダ内にviwerフォルダを配置してください。\n' +
          'http://vivliostyle.com/ja/products/#secProducts-download'
        );
        _vsmode = false;
      }
    }
    // vsmodeによってファイルを切り替える
    let url;
    let bname = path.basename(htmlfilepath);
    if(path.dirname(htmlfilepath) !== _homePath){
      bname = path.relative(_homePath, htmlfilepath);
      bname = bname.replace(/\\/g, '/');
    }
    console.log('bname is ' + bname);
    if (_vsmode) {
      url = 'http://localhost:' + _webport + '/viewer/vivliostyle-viewer.html#x=../' + bname;
    } else {
      url = 'http://localhost:' + _webport + '/' + bname;
    }
    console.log('url ' + url);
    // iframeのsrcを変更する
    this.vsiframe.src = '';
    this.vsiframe.src = url;
    // 白化け現象対策
    if(this.vsiframe.contentDocument){
      this.vsiframe.contentDocument.location.reload(true);
      this.vsiframe.contentDocument.location.replace(url);
    }
  }

  exportInDesignXML() {
    if (_masterPath === '') return;
    MarkdownBookPreviewConvert.exportInDesignXML(
      path.join(path.dirname(_masterPath), path.basename(_masterPath, '.md')) + '.html'
    );
  }

  openPrintPDFPath() {
    if (_masterPath === '') return;
    let bname = path.basename(_masterPath);
    if(path.dirname(_masterPath) !== _homePath){
      bname = path.relative(_homePath, _masterPath);
      bname = bname.replace(/\\/g, '/');
    }
    bname = bname.replace('.md', '.html');
    let url = 'http://localhost:' + _webport + '/viewer/vivliostyle-viewer.html#x=../' + bname;
    shell.openExternal(url);
  }

}
