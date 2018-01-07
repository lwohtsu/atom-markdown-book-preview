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
        host,
        pathname
      } = url.parse(uriToOpen);

      if (protocol === 'markdown-book-preview:') {
        // const view = new TextEditor();
        const view = new MarkdownBookPreviewView(
          state.markdownBookPreviewViewState
        );
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
    atom.workspace.open("markdown-book-preview://editor/#" + editor.id);
  }

};
