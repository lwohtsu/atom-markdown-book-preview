'use babel';

import { File } from 'atom';

export default class MarkdownBookPreviewView{
  constructor (params = {}) {
    console.log(params);
    // this.id = params.id != null ? params.id : nextId++
    // // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('markdown-book-preview');
    this.element.textContent = 'The MarkdownBookPreview package is Alive!';
    //
    // // Create message element
    // const message = document.createElement('div');
    // message.textContent = 'The MarkdownBookPreview package is Alive! It\'s ALIVE!';
    // message.classList.add('message');
    // this.element.appendChild(message);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    return null;
  }

  // Tear down any state and detach
  destroy() {
    // this.element.remove();
  }

  // Get the Element for the editor.
  getElement () {
    return this.element
  }

  getTitle(){
    return "markdown-book-preview"
  }

}
