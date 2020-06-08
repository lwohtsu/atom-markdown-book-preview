'use babel';

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import liveServer from './live-server';
import MarkdownBookPreviewConvert from './markdown-book-preview-convert';
import {
    shell
} from 'electron';

export default class MarkdownBookPreviewServer {
    // コンストラクタ
    constructor(params = {}) {
        // Webサーバポート
        this.webport = 8085;
        //
        this.liveserver = null;
        this.liverserverURL = '';
        this.watcher = null;
    }

    // Returns an object that can be retrieved when package is activated
    serialize() {
        return null;
    }
    // Tear down any state and detach
    destroy() {
        // this.element.remove();
        console.log("destroy");
        this.liveserver.close();
        this.liveserver = null;
        liveServer.shutdown();
        // atom.notifications.addWarning('[Live Server] 停止しました')
    }

    // サーバーを起動
    startWebServer() {
        // サーバー起動済みならリターン
        if (this.liveserver) {
            atom.notifications.addWarning('[Live Server] すでに開始しています' + this.liverserverURL);
            return;
        }
        const targetPath = atom.project.getPaths()[0];
        console.log(targetPath);
        if (!targetPath) {
            atom.notifications.addWarning('[Live Server] フォルダを開いた状態で実行してください')
            return;
        }

        var params = {
            port: this.webport,
            host: "127.0.0.1",
            root: targetPath,
            open: false, // When false, it won't load your browser by default.
            // watch: 'html,css',
            ignore: '**/*.pdf',
            // ignore: 'scss,my/templates', // comma-separated string for paths to ignore
            // file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
            //wait: 100, // Waits for all changes, before reloading. Defaults to 0 sec.
            // mount: [
            //     ['/components', './node_modules']
            // ], // Mount a directory to a route.
            //logLevel: 0, // 0 = errors only, 1 = some, 2 = lots
        };
        setTimeout(() => {
            try {
                this.liveserver = liveServer.start(params);
            } catch (err) {
                console.error(err);
                callback({
                    errorMsg: err
                });
            }
        }, 0);

        this.liverserverURL = 'http://127.0.0.1:' + this.webport;
        console.log(this.liveserver);
        console.log(this.liverserverURL);
        // 接続確認
        setTimeout(() => {
            if (!this.liveserver._connectionKey) {
                console.log(this.liveserver._connectionKey);
                atom.notifications.addWarning('[Live Server] 起動済みのLive Serverを終了してから起動してください');
                this.liveserver = null;
                liveServer.shutdown();
            } else {
                atom.notifications.addInfo('[Live Server] 開始しました' + this.liverserverURL);
            }
        }, 1000);

    }

    stopWebServer() {
        console.log('stopWebServer' + this.liveserver);
        if (!this.liveserver) return;
        // _liveserver.shutdown();
        this.liveserver.close();
        this.liveserver = null;
        liveServer.shutdown();
        atom.notifications.addInfo('[Live Server] 停止しました')
    }

    setTargetMarkdownFile(mdpath, vsmode) {
        if (!this.liveserver) {
            atom.notifications.addWarning('先にLive Serverを開始してください' + this.liverserverURL);
        }
        // homepath（viewerがあるフォルダ）を探索
        let homePath = path.dirname(mdpath);
        const targetPath = atom.project.getPaths()[0];
        if (fs.existsSync(path.join(homePath, 'viewer')) === false) {
            // 上の階層を探索
            // console.log(path.dirname(homePath));
            do {
                homePath = path.dirname(homePath);
                // console.log(homePath);
                if (homePath.length < targetPath.length) {
                    atom.notifications.addWarning('viewerが見つかりません');
                    return;
                }
                if (fs.existsSync(path.join(homePath, 'viewer'))) break;
            } while (homePath !== targetPath)
        }
        console.log(homePath);

        // markdownからhtmlファイルを作成
        try {
            const htmlfilepath = MarkdownBookPreviewConvert.convertMarkdown(mdpath, homePath);
            console.log('htmlfilepath= ' + htmlfilepath);
            // URLを生成
            if (vsmode) {
                // Vivliostyleモード
                let bname1 = path.relative(targetPath, homePath);
                let bname2 = path.relative(path.join(homePath, 'viewer'), htmlfilepath);
                let url = this.liverserverURL + '/' + bname1 + '/viewer/vivliostyle-viewer.html#x=' + bname2;
                if (fs.existsSync(path.join(homePath, 'viewer/index.html'))) {
                    url = this.liverserverURL + '/' + bname1 + '/viewer/#src=' + bname2;
                }
                url = url.replace(/\\/g, '/');
                console.log('bname1=' + bname1);
                console.log('bname2=' + bname2);
                console.log('url=' + url);
                shell.openExternal(url);
            } else {
                // HTML
                let bname = path.relative(targetPath, htmlfilepath);
                let url = this.liverserverURL + '/' + bname;
                url = url.replace(/\\/g, '/');
                console.log('url=' + url);
                shell.openExternal(url);
            }
        } catch (err) {
            atom.notifications.addError(err.message);
            return;
        }

        // ファイル監視設定
        if (this.watcher) {
            this.watcher.close();
        }
        this.watcher = chokidar.watch(mdpath);
        const __homePath = homePath;
        this.watcher.on('change', function(path) {
            // console.log(path);
            MarkdownBookPreviewConvert.convertMarkdown(path, __homePath);
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
