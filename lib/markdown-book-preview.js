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

    // カスタムオープナー
    atom.workspace.addOpener((uriToOpen) => {
      // console.log("custom opener");
      const {
        protocol,
        hash,
        host,
        pathname
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

  toggle() {
    console.log('MarkdownBookPreview was toggled!');
    const editor = atom.workspace.getActiveTextEditor();
    const path = editor.getPath();
    if (!path) {
      atom.notifications.addInfo('ファイルを保存してから実行してください');
      return;
    }
    if (path.indexOf('.md') < 0) {
      atom.notifications.addInfo('Mardownファイルではありません');
      return;
    }
    MarkdownBookPreviewView.setMasterPath(path);
    atom.workspace.open(
      "markdown-book-preview://editor/#" + editor.id, {
        split: 'right'
      }
    );
  }

};
