'use babel';

import MarkdownBookPreviewView from './markdown-book-preview-view';
import { CompositeDisposable } from 'atom';

export default {

  markdownBookPreviewView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.markdownBookPreviewView = new MarkdownBookPreviewView(state.markdownBookPreviewViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.markdownBookPreviewView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'markdown-book-preview:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.markdownBookPreviewView.destroy();
  },

  serialize() {
    return {
      markdownBookPreviewViewState: this.markdownBookPreviewView.serialize()
    };
  },

  toggle() {
    console.log('MarkdownBookPreview was toggled!');
    atom.workspace.open();
    // return (
    //   this.modalPanel.isVisible() ?
    //   this.modalPanel.hide() :
    //   this.modalPanel.show()
    // );
  }

};
