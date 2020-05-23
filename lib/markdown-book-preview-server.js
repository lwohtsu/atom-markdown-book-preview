'use babel';

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import liveServer from 'live-server';
import MarkdownBookPreviewConvert from './markdown-book-preview-convert';
import {
    shell
} from 'electron';

// シングルトン
let _instance = null;
// ファイルパス格納用
let _homePath = '';
// Vivliostyleモード
// let _vsmode = false;
// Webサーバポート
const _webport = 8085;
//
let _liveserver = null;
let _liverserverURL = '';
let _watcher = null;

export default class MarkdownBookPreviewServer {
    // シングルトン化
    static instance(params = {}) {
        if (_instance === null) {
            _instance = new MarkdownBookPreviewServer(params);
        }
        return _instance
    }

    // Vivliostyleモードをセット
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
        _liveserver.shutdown();
        _liveserver.close();
        _liveserver = null;
        liveServer.shutdown();
        // atom.notifications.addWarning('[Live Server] 停止しました')
    }

    static setFilePath(mpath) {
        _masterPath = mpath;
    }

    // サーバーを起動
    startWebServer() {
        // if (_masterPath === "") {
        //   atom.notifications.addInfo('ファイルパスがセットされていません');
        //   return;
        // }
        // サーバー起動済みならリターン
        if (_liveserver) {
            atom.notifications.addWarning('[Live Server] すでに開始しています' + _liverserverURL);
            return;
        }
        const targetPath = atom.project.getPaths()[0];
        console.log(targetPath);
        if (!targetPath) {
            atom.notifications.addWarning('[Live Server] フォルダを開いた状態で実行してください')
            return;
        }

        var params = {
            port: _webport,
            host: "0.0.0.0",
            root: targetPath,
            open: false, // When false, it won't load your browser by default.
            watch: '**/*.html,**/*.css',
            ignore: '**/*.js,**/*.md,**/*.pdf',
            // ignore: 'scss,my/templates', // comma-separated string for paths to ignore
            // file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
            wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
            // mount: [
            //     ['/components', './node_modules']
            // ], // Mount a directory to a route.
            logLevel: 0, // 0 = errors only, 1 = some, 2 = lots
        };
        _liveserver = liveServer.start(params);

        _liverserverURL = 'http://localhost:' + _webport;
        console.log(_liveserver);
        console.log(_liverserverURL);
        if (_liveserver) {
            atom.notifications.addWarning('[Live Server] 開始しました' + _liverserverURL);
        }

    }

    stopWebServer() {
        // _liveserver.shutdown();
        _liveserver.close();
        _liveserver = null;
        liveServer.shutdown();
        atom.notifications.addWarning('[Live Server] 停止しました')
    }

    setTargetMarkdownFile(mdpath, vsmode) {
        if (!_liveserver) {
            atom.notifications.addWarning('先にLive Serverを開始してください' + _liverserverURL);
        }
        // homepath（viewerがあるフォルダ）を探索
        let homePath = path.dirname(mdpath);
        const targetPath = atom.project.getPaths()[0];
        if (fs.existsSync(path.join(homePath, 'viewer')) === false) {
            // 上の階層を探索
            // console.log(path.dirname(homePath));
            do {
                homePath = path.dirname(homePath);
                if (fs.existsSync(path.join(homePath, 'viewer'))) break;
            } while (homePath !== targetPath)
        }
        console.log(homePath);
        _homePath = homePath;

        // markdownからhtmlファイルを作成
        try {
            const htmlfilepath = MarkdownBookPreviewConvert.convertMarkdown(mdpath, homePath);
            console.log('htmlfilepath= ' + htmlfilepath);
            // URLを生成
            if (vsmode) {
                // Vivliostyleモード
                let bname1 = path.relative(targetPath, homePath);
                let bname2 = path.relative(path.join(homePath, 'viewer'), htmlfilepath);
                let url = _liverserverURL + '/' + bname1 + '/viewer/vivliostyle-viewer.html#x=' + bname2;
                url = url.replace(/\\/g, '/');
                console.log('bname1=' + bname1);
                console.log('bname2=' + bname2);
                console.log('url=' + url);
                shell.openExternal(url);
            } else {
                // HTML
                let bname = path.relative(targetPath, htmlfilepath);
                let url = _liverserverURL + '/' + bname;
                url = url.replace(/\\/g, '/');
                console.log('url=' + url);
                shell.openExternal(url);
            }
        } catch (err) {
            atom.notifications.addError(err.message);
            return;
        }

        // ファイル監視設定
        if (_watcher) {
            _watcher.close();
        }
        _watcher = chokidar.watch(mdpath);
        _watcher.on('change', function(path) {
            // console.log(path);
            const htmlfilepath = MarkdownBookPreviewConvert.convertMarkdown(path, _homePath);
        });
    }

    exportInDesignXML(mdpath) {
        let homePath = path.dirname(mdpath);
        const targetPath = atom.project.getPaths()[0];
        if (fs.existsSync(path.join(homePath, 'viewer')) === false) {
            // 上の階層を探索
            do {
                homePath = path.dirname(homePath);
                if (fs.existsSync(path.join(homePath, 'viewer'))) break;
            } while (homePath !== targetPath)
        }
        const htmlfilepath = MarkdownBookPreviewConvert.convertMarkdown(mdpath, homePath);
        MarkdownBookPreviewConvert.exportInDesignXML(htmlfilepath);
    }


}
