'use babel';

import fs from 'fs';
import path from 'path';
import marked from 'marked';
import hljs from 'highlight.js';
import _ from 'lodash';
import imageSize from 'image-size'

export default class MarkdownBookPreviewConvert{
  // markdownファイルを変換
  static convertMarkdown(mdpath) {
    const workdir = path.dirname(mdpath);

    //書き出しファイル名
    const htmlfilepath = mdpath.replace('.md', '.html');
    //テンプレートの読み込み
    let template;
    try {
      template = fs.readFileSync(
        path.join(workdir, '_template.html'), 'utf-8');
    } catch (err) {
      atom.notifications.addInfo('File Open Error' + err.message);
      throw new Error('_template.html not found.');
    }

    //markedのオプション設定
    marked.setOptions({
      renderer: new marked.Renderer(),
      gfm: true, //GitHub Flavored Markdown
      tables: true, //表組み対応
      breaks: false, //GFMページブレーク対応
      pedantic: false,
      sanitize: false, //HTMLタグのエスケープ（svgなどを通したいので無効に）
      smartLists: true,
      smartypants: false,
      // コードハイライト用の関数を当てる
      highlight: function(code, lang) {
        let out = code;
        // ```言語名 での指定があればそれを使う
        try {
          out = hljs.highlight(lang, code).value;
        } catch (e) {
          out = hljs.highlightAuto(code).value;
        }
        return out;
      }
    });

    // ファイルを読み込み
    let src;
    try {
      src = fs.readFileSync(mdpath, 'utf-8');
    } catch (err) {
      atom.notifications.addInfo('File Open Error' + err.message);
      throw new Error('cannot open file.');
    }

    // 画像のsvg変換
    src = MarkdownBookPreviewConvert.svgimg(src, workdir);

    // markedで変換
    let html = marked(src);

    // 強引な後処理 閉じpreの後に改行（入れないとXML変換時にトラブルと思う）
    html = html.replace(/<\/pre>/g, '</pre>\n');

    // _postReplaceList.jsonがあれば後置換を実行
    try {
      const replisttext = fs.readFileSync(
          path.join(workdir, '_postReplaceList.json'), 'utf-8');
      const replist = JSON.parse(replisttext);
      for (let i = 0; i < replist.length; i++) {
        html = html.replace(new RegExp(replist[i].f, 'g'), replist[i].r);
      }
    } catch (err) {
      atom.notifications.addInfo('Replist Open Error' + err.message);
      console.log('no replist');
    }
    //連番処理〓文字を数値に置換
    //〓文字の数で連番の種類を分けられる
    let counter = 1;
    html = html.replace(/〓〓〓〓〓/g, function() {
      return counter++;
    });
    counter = 1;
    html = html.replace(/〓〓〓〓/g, function() {
      return counter++;
    });
    counter = 1;
    html = html.replace(/〓〓〓/g, function() {
      return counter++;
    });
    counter = 1;
    html = html.replace(/〓〓/g, function() {
      return counter++;
    });
    counter = 1;
    html = html.replace(/〓/g, function() {
      return counter++;
    });

    // lodashを使ってテンプレートにはめ込んで書き出す
    let compiled = _.template(template);
    try {
      fs.writeFileSync(htmlfilepath, compiled({content: html}));
    } catch (err) {
      atom.notifications.addInfo('File Write Error' + err.message);
      throw new Error('cannot write file.');
    }

    return htmlfilepath;
  }

  // クエリ文字列（?svgimg=倍率,幅トリム,高さトリム,縦シフト,横シフト）SVG
  // 倍率以外は省略可
  static svgimg(mdtext, workdir) {
    // console.log('svgimg');
    // 解像度からmmを得るための値を求めておく
    const density = 72;
    const dpi2mm = 25.4 / density;
    // 置換実行
    const mdsvgtext = mdtext.replace(/!\[[^\]]*\]\(([^\)]+)\)/g, function(str, $1) {
      // strはマッチテキスト全体、$1はファイル名
      // クエリ文字列?svgimg=を含まない場合は置換しない
      let s = $1.indexOf('?svgimg=');
      if (s < 0) return str;
      let imgpath = path.join(workdir, $1.substring(0, s));
      // console.log(imgpath);
      // パラメータを取得
      let scale = 1;
      let trimW = 0,
        trimH = 0;
      let shiftX = 0,
        shiftY = 0;
      let params = $1.substring($1.indexOf('=') + 1).split(',');
      if (params.length < 1) return str; // パラメータ不正
      scale = parseFloat(params[0]) / 100;
      if (params.length > 1 && params[1].length > 0) trimW = parseFloat(params[1]);
      if (params.length > 2 && params[2].length > 0) trimH = parseFloat(params[2]);
      if (params.length > 3 && params[3].length > 0) shiftX = parseFloat(params[3]);
      if (params.length > 4 && params[4].length > 0) shiftY = parseFloat(params[4]);
      // console.log(scale + ', ' + trimW + ', ' + trimH + ', ' + shiftX + ', ' + shiftY);
      // サイズを取得
      let size = imageSize(imgpath);
      let printW = size.width * dpi2mm;
      let printH = size.height * dpi2mm;
      // 小数点第三位までにしておく
      printW = Math.round(printW * 1000) / 1000;
      printH = Math.round(printH * 1000) / 1000;
      // 拡大縮小を反映
      let newscale = scale;
      let scaleW = printW * newscale;
      let scaleH = printH * newscale;
      // 小数点第三位までにしておく
      newscale = Math.round(newscale * 1000) / 1000;
      scaleW = Math.round(scaleW * 1000) / 1000;
      scaleH = Math.round(scaleH * 1000) / 1000;
      if (trimW == 0) trimW = scaleW;
      if (trimH == 0) trimH = scaleH;
      // svg生成
      let result = '<svg width="' + trimW + 'mm" height="' + trimH + 'mm" ' +
        'viewBox="0 0 ' + trimW + ' ' + trimH + '">\n';
      result += '<image width="' + printW + '" height="' + printH + '" ' +
        'xlink:href="' + $1.substring(0, s) + '" ' +
        'transform="translate(' + shiftX + ',' + shiftY + ') ' +
        'scale(' + newscale + ')"> \n';
      result += '</svg> \n';
      // console.log(result);
      return result;
    });

    return mdsvgtext;
  }

}
