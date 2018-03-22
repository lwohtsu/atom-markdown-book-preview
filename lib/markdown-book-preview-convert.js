'use babel';

import fs from 'fs';
import path from 'path';
import marked from 'marked';
import hljs from 'highlight.js';
import _ from 'lodash';
import imageSize from 'image-size'
import cheerio from 'cheerio';

export default class MarkdownBookPreviewConvert {
  // markdownファイルを変換
  static convertMarkdown(mdpath, homepath) {
    const workdir = path.dirname(mdpath);

    //書き出しファイル名
    const htmlfilepath = mdpath.replace('.md', '.html');
    //テンプレートの読み込み
    let template;
    try {
      template = fs.readFileSync(
        path.join(homepath, '_template.html'), 'utf-8');
    } catch (err) {
      atom.notifications.addError('File Open Error' + err.message);
      throw new Error('_template.html not found.');
    }
    //テンプレート中のcssパスを強引に置換
    if(workdir !== homepath){
      let bname = path.relative(workdir, homepath);
      bname = bname.replace(/\\/g, '/');
      template = template.replace(/href=\"/g, 'href="' + bname + '/');
      console.log(template);
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
        path.join(homepath, '_postReplaceList.json'), 'utf-8');
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
    html = html.replace(/〓〓〓〓〓〓/g, function() {
      return counter++;
    });
    counter = 1;
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

    // lodashを使ってテンプレートにはめ込む
    let compiled = _.template(template);
    let finalhtmltext = compiled({
      content: html
    });

    // postManiuplate処理
    const mnppath = path.join(homepath, '_postManipulate.json');
    console.log('check ' + mnppath);
    if (fs.existsSync(mnppath) === true) {
      console.log(mnppath + ' found');
      const mnptext = fs.readFileSync(mnppath, 'utf-8');
      const mnplist = JSON.parse(mnptext);
      let $ = cheerio.load(finalhtmltext,{decodeEntities:true});
      for (let i = 0; i < mnplist.length; i++) {
        // メソッドを実行
        switch(mnplist[i].method){
          case "wrap":
            console.log("wrap");
            $(mnplist[i].selector).wrap($(mnplist[i].paramator));
            break;
          case "wrapWithNextSib":
            console.log("wrapWithNextSib");
            $(mnplist[i].selector).each(function(){
              const section = $(this).add($(this).next());
              const newelem = $(this).before($(mnplist[i].paramator)).prev();
              newelem.append(section);
            });
            break;
          case "wrapAll":
            console.log("wrapAll");
            // selectorとparamator[0]が隣接した要素を探す
            $(mnplist[i].selector + "+" + mnplist[i].paramator[0]).each(function(){
              const newelem = $(this).before($(mnplist[i].paramator[1])).prev();
              console.log(mnplist[i].selector + "+" + mnplist[i].paramator[0]);
              const nextsiv = $(this).nextAll();
              newelem.append($(this));
              nextsiv.each(function(){
                console.log(this.tagName);
                if (this.tagName != mnplist[i].paramator[0]) return false;
                newelem.append($(this));
              });
            });
            break;
        }
      }
      finalhtmltext = $.html();
    }

    // ファイルを書き出す
    try {
      fs.writeFileSync(htmlfilepath, finalhtmltext);
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

  // InDesign用のXMLを書き出す
  static exportInDesignXML(htmlfile) {
    console.log('exportXML ' + htmlfile);
    const workfolder = path.dirname(htmlfile);
    // ファイルを読み込み
    let src, $;
    try {
      src = fs.readFileSync(htmlfile, 'utf-8');
      $ = cheerio.load(src,{decodeEntities:true});
    } catch (err) {
      atom.notifications.addInfo('File Open Error' + err.message);
      throw new Error('cannot open file.');
    }
    // body要素を取得
    let body = $('body');
    //console.log(body);

    // XMLを構築
    let out = '<?xml version="1.0" encoding="UTF-8"?>';
    out += '<story xmlns:aid5="http://ns.adobe.com/AdobeInDesign/5.0/" ' +
      'xmlns:aid="http://ns.adobe.com/AdobeInDesign/4.0/">' +
      '</story>';
    let $x = cheerio.load(out, {
      normalizeWhitespace: true,
      xmlMode: true,
      decodeEntities:true
    });
    let xstory = $x('story');
    console.log($x.xml());
    htmltoxml(body.get(0), xstory.get(0));

    //書き出しファイル名
    let xmlfilepath = path.join(workfolder, path.basename(htmlfile, '.html')) + '.xml';
    console.log(xmlfilepath);
    let xmltext = $x.xml();
    // img要素が単独要素にならないので、置換で強引に直す。
    xmltext = xmltext.replace(/>[^<]*<\/img>/g, '/>');
    // 画像タグの後の改行を詰める（Atom版ではかえっておかしくなる？）
    // xmltext = xmltext.replace(/<div_figure>\n/g, '<div_figure>');
    // xmltext = xmltext.replace(/<svg>\n/g, '<svg>');
    // xmltext = xmltext.replace(/\n<\/svg>\n/g, '</svg>');
    // xmltext = xmltext.replace(/<\/div_figcaption>\n/g, '</div_figcaption>');
    // xmltext = xmltext.replace(/\n<div_figcaption>/g, '<div_figcaption>');
    //
    // xmltext = xmltext.replace(/\n<div_kakomilist>/g, '<div_kakomilist>');
    xmltext = xmltext.replace(/<div_kakomilist>\n/g, '<div_kakomilist>');
    // xmltext = xmltext.replace(/<\/div_kakomilist>\n/g, '</div_kakomilist>');
    xmltext = xmltext.replace(/\n<div_kakomilist>/g, '<div_kakomilist>');
    // preの後の改行を詰める（Atom版ではかえっておかしくなる？）
    // xmltext = xmltext.replace(/<\/pre>\n/g, '</pre>');
    // br要素をただの改行に
    xmltext = xmltext.replace(/<br\/>/g, '\n');
    // theadとtbodyを取り除き、thはtdに
    xmltext = xmltext.replace(/<thead>\n/g, '');
    xmltext = xmltext.replace(/<tbody>\n/g, '');
    xmltext = xmltext.replace(/<\/thead>\n/g, '');
    xmltext = xmltext.replace(/<\/tbody>\n/g, '');
    xmltext = xmltext.replace(/<th>/g, '<td>');
    xmltext = xmltext.replace(/<\/th>/g, '</td>');

    // ファイル書き出し
    try {
      fs.writeFileSync(xmlfilepath, xmltext);
    } catch (err) {
      atom.notifications.addError('File Write Error' + err.message);
      throw new Error('cannot write file.');
    }

    return;

    // 下請けの再帰関数
    function htmltoxml(htmldom, xmldom) {
      if (htmldom.type == 'tag') {
        // 要素の移植
        let name = htmldom.tagName;
        let classname = $(htmldom).attr('class');
        // svgのimage要素の場合はimg要素にタグ名を変更
        if (name == 'image') name = 'img';
        // 見出しまたは段落要素であれば、親要素のクラス名をタグ名に加える
        if ('h1h2h3h4h5h6p'.indexOf(htmldom.tagName) >= 0) {
          classname = $(htmldom.parentNode).attr('class')
        }
        // li要素の場合、親がul、olの場合で書き出しタグを変える（ul_li、ol_liになる）
        if (name == 'li') {
          let parent = htmldom.parentNode;
          name = parent.tagName + '_' + name;
        }
        // HTMLのタグ名とクラス名を連結したものをXMLのタグ名とする
        if (classname) name = name + '_' + classname.replace(/ /g, "_");
        $x(xmldom).append('<' + name + '></' + name + '>');
        // 追加したノードを取得
        let nodes = $x(xmldom).children(name);
        let newnode = nodes[nodes.length - 1];
        // img要素の場合はsrc属性をhref属性として移植
        if (htmldom.tagName == 'img') {
          $x(newnode).attr('href', 'file://' + $(htmldom).attr('src'));
        }
        // svgのimage要素のhref属性の場合はxlink:hrefをhref属性として移植
        if (htmldom.tagName == 'image') {
          $x(newnode).attr('href', 'file://' + $(htmldom).attr('href'));
          // 変形指定を分割して個別の属性にする
          let tfvalue = $(htmldom).attr('transform');
          tfvalue = tfvalue.replace(/translate\(([^,]*),([^\)]*)\) scale\(([^\)]+)\)/, '$1 $2 $3');
          let params = tfvalue.split(' ');
          $x(newnode).attr('translate-x', params[0]);
          $x(newnode).attr('translate-y', params[1]);
          $x(newnode).attr('scale', params[2]);
          let parent = htmldom.parentNode;
          // 親がsvg要素の場合はwidthとheightを移植
          if (parent.tagName == 'svg') {
            $x(newnode).attr('width', $(parent).attr('width'));
            $x(newnode).attr('height', $(parent).attr('height'));
          }
        }
        // 子の取得
        let contents = $(htmldom).contents();
        if (contents.length > 0) {
          for (let i = 0; i < contents.length; i++) {
            htmltoxml(contents.get(i), newnode);
          }
        }
      } else if (htmldom.type == 'text') {
        // テキストノード
        // テキストすべて16進数になってしまうが問題はないらしい
        $x(xmldom).append(htmldom);
      }
    }

  }


}
