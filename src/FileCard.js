import {template} from './template.js'

Element.prototype.hide = function () {
  this.classList.add('hidden');
};

Element.prototype.show = function () {
  this.classList.remove('hidden');
};

function prepareDropzone() {
  const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  events.forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults, false);
  });
}

export default class FileCard extends HTMLElement {
  constructor() {
    super();
    this.data = {
      fileName: '',
      fileExtension: '',
      file: null,
    };
    prepareDropzone();
    window.test = this
  }

  connectedCallback() {
    this.makeDataProxy();
    this.shadow = this.attachShadow({mode: 'open'});
    this.render();
  }

  makeDataProxy() {
    this.data = new Proxy(this.data, {
      set: (target, prop, value, receiver) => {
        Reflect.set(target, prop, value, receiver);
        this.handleChanges(prop, value);
        return true;
      },
    });
  }

  handleChanges(prop, value) {
    console.log(prop)
    switch (prop) {
      case 'fileName':
        if (value) {
          console.log('name changed')
          this.fileInput.removeAttribute('disabled')
          this.setTooltip('Загрузите ваш файл');
        } else {
          console.log('nono')
          this.fileInput.setAttribute('disabled', '')
          this.setTooltip('Перед загрузкой дайте имя файлу ');
          this.textInput.value = '';
          this.textInputPannel.show()
          this.data.formDisabled = true;
        }
        break;
      case 'file':
        if (!value) {
        this.textInputPannel.show()
        this.infoPannel.hide()
        this.progressIndicator.classList.remove('animating')
          this.data.formDisabled = true;
          return;
        }
        this.nameInfo.innerHTML = this.data.fileName + '.' + value.name.split('.')[1]
        this.infoPannel.show()
        this.progressIndicator.classList.add('animating')
        this.data.formDisabled = false;
        setTimeout(() => {
          this.checkExtension();
          this.checkSize();
        }, 0);

        break;
      case 'formDisabled':
        if (value) {
          console.log(this.submitButton)
          this.submitButton.setAttribute('disabled', '');
        } else {
          this.submitButton.removeAttribute('disabled');
        }

      default:
        console.log('default');
    }
  }

  checkExtension() {
    if (!/\.(txt|json|csv)/.test(this.data.file?.name || '')) {
      this.data.file = null;
    }
  }

  checkSize() {
    console.log(this.data.file.size);
  }

  render() {
    this.shadow.innerHTML = template;

    this.fileInput = this.shadowRoot.querySelector('.file-card__file-input');
    this.form = this.shadowRoot.querySelector('.file-card__form');
    this.textInput = this.shadowRoot.querySelector('.file-card__input');
    this.clearTextButton = this.shadowRoot.querySelector('.file-card__clear-input');

    this.textInputPannel = this.shadowRoot.querySelector(
      '.file-card__input-wrapper'
    );
    this.tooltip = this.shadowRoot.querySelector('.file-card__tooltip');
    this.submitButton = this.shadowRoot.querySelector('.file-card__submit');
    this.dropzone = this.shadowRoot.querySelector('.file-card__dropzone')
    this.infoPannel = this.shadowRoot.querySelector('.file-card__info')
    this.progressIndicator = this.shadowRoot.querySelector('.file-card__progress-indicator')
    this.deleteAllButton = this.shadowRoot.querySelector('.file-card__delete')
    this.nameInfo = this.shadowRoot.querySelector('.file-card__filename')
    this.messagePannel = this.shadowRoot.querySelector('.file-card__user-message')

    this.dropzone.addEventListener(
      'drop',
      (e) => {
        if (!this.data.fileName) {
          return
        }
        this.data.file = e.dataTransfer.files[0];
        this.textInputPannel.hide();
      },
      false
    );




    this.fileInput.addEventListener('change', (e) => {
      this.data.file = e.target.files[0];
      this.textInputPannel.hide()

    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.form.classList.add('transformed')
    });

    this.textInput.addEventListener('change', (e) => {
      this.data.fileName = e.currentTarget.value;
    });

    this.clearTextButton.addEventListener('click', (e) => {
      this.data.fileName = '';
    });

    this.deleteAllButton.addEventListener('click', () => {
      this.data.file = null
      this.data.fileName = ''
    })
  }

  sendFile() {
    if (this.formDisabled) {
      return
    }
    const fd = new FormData();
    fd.append('file', this.data.file, 'test.json');
    fd.append('name', this.data.name);
    fetch('https://file-upload-server-mc26.onrender.com/api/v1/upload', {
      method: 'POST',
      body: fd,
    })
      .then(() => {
        console.log('success');
      })
      .catch((e) => {
        console.log('bad(', e.message);
      })
      .finally(() => console.log('finally'));
  }

  

  setTooltip(value) {
    this.tooltip.classList.add('transparent');
    setTimeout(() => {
      this.tooltip.innerHTML = value;

      this.tooltip.classList.remove('transparent');
    }, 150);
  }
}

customElements.define('file-card', FileCard);
