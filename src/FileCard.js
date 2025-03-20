import {template} from './template.js';
import axios from 'axios';

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
      file: null,
    };
    prepareDropzone();
    window.test = this;
  }

  get fileExtension() {
    if (!this.data.file) {
      return '';
    } else {
      return this.data.file.name.split('.')[1] || '';
    }
  }

  get fileNameWithExtension() {
    return `${this.data.fileName}.${this.fileExtension}`;
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

  handleFileName(value) {
    if (value) {
      this.fileInput.removeAttribute('disabled');
      this.setTooltip('Загрузите ваш файл');
    } else {
      this.fileInput.setAttribute('disabled', '');
      this.setTooltip('Перед загрузкой дайте имя файлу');
      this.textInput.value = '';
      this.textInputPannel.show();
      this.data.formDisabled = true;
    }
  }

  handleFile(value) {
    if (!value) {
      this.textInputPannel.show();
      this.infoPannel.hide();
      this.progressIndicator.classList.remove('animating');
      this.submitButton.setAttribute('disabled', '');
    } else {
      this.nameInfo.innerHTML =
        this.data.fileName + '.' + value.name.split('.')[1];
      this.infoPannel.show();
      this.submitButton.removeAttribute('disabled');
      setTimeout(() => {
        this.checkExtension();
        this.checkSize();
      }, 0);
    }
  }

  handleChanges(prop, value) {
    switch (prop) {
      case 'fileName':
        this.handleFileName(value);
        break;
      case 'file':
        this.handleFile(value);

        break;
      case 'formDisabled':
        if (value) {
          console.log(this.submitButton);
        } else {
        }

      default:
        console.log('default');
    }
  }

  checkExtension() {
    if (!/\.(txt|json|csv)/.test(this.data.file?.name || '')) {
      this.data.file = null;
      this.showError('Допустимы только расширения .txt, .json и .csv');
    }
  }

  checkSize() {
    if (this.data.file.size > 1024) {
      this.data.file = null;
      this.showError('Допустимый размер до 1Кб');
    }
  }

  setTooltip(value) {
    this.tooltip.classList.add('transparent');
    setTimeout(() => {
      this.tooltip.innerHTML = value;

      this.tooltip.classList.remove('transparent');
    }, 150);
  }
  setTitle(value) {
    console.log(this.header.classList);
    this.header.classList.add('transparent');
    setTimeout(() => {
      this.header.innerHTML = value;

      this.header.classList.remove('transparent');
    }, 150);
  }

  showSuccess(message) {
    this.form.classList.add('user-message');
    this.setTitle('Файл успешно загружен');
    this.setTooltip(message);
  }

  showError(message) {
    this.form.classList.add('user-message');
    this.form.classList.add('user-error');
    this.setTitle('Ошибка загрузки');
    this.setTooltip(message);
  }

  hideMessage() {
    this.form.classList.remove('user-message');
    this.form.classList.remove('user-error');
    this.setTitle('Окно загрузки');
    const message = this.data.fileName
      ? 'Загрузите ваш файл'
      : 'Перед загрузкой дайте имя файлу';
    this.setTooltip(message);
  }

  initElements() {
    this.fileInput = this.shadowRoot.querySelector('.file-card__file-input');
    this.form = this.shadowRoot.querySelector('.file-card__form');
    this.textInput = this.shadowRoot.querySelector('.file-card__input');
    this.clearTextButton = this.shadowRoot.querySelector(
      '.file-card__clear-input'
    );

    this.textInputPannel = this.shadowRoot.querySelector(
      '.file-card__input-wrapper'
    );
    this.tooltip = this.shadowRoot.querySelector('.file-card__tooltip');
    this.submitButton = this.shadowRoot.querySelector('.file-card__submit');
    this.dropzone = this.shadowRoot.querySelector('.file-card__dropzone');
    this.infoPannel = this.shadowRoot.querySelector('.file-card__info');
    this.progressIndicator = this.shadowRoot.querySelector(
      '.file-card__progress-indicator'
    );
    this.deleteAllButton = this.shadowRoot.querySelector('.file-card__delete');
    this.nameInfo = this.shadowRoot.querySelector('.file-card__filename');
    this.messagePannel = this.shadowRoot.querySelector(
      '.file-card__user-message'
    );
    this.header = this.shadowRoot.querySelector('.file-card__title');
    this.closeButton = this.shadowRoot.querySelector(
      '.file-card__close-button'
    );
    this.dataPannel = this.shadowRoot.querySelector('.file-card__data');
    this.percents = this.shadowRoot.querySelector('.file-card__percents');
  }

  indicateProgress() {
    this.dataPannel.classList.add('sending');
    this.progressIndicator.classList.add('animating');
    let currentPercents = 0;
    const interval = setInterval(() => {
      this.percents.innerHTML = currentPercents + '%';
      currentPercents += 10;
      if (currentPercents > 80) {
        clearInterval(interval);
      }
    }, 200);
  }

  completeProgress() {
    this.progressIndicator.classList.remove('animating');
    this.progressIndicator.classList.add('completing');
    let currentPercents = 80;
    const interval = setInterval(() => {
      this.percents.innerHTML = currentPercents + '%';
      currentPercents += 10;
      if (currentPercents > 100) {
        clearInterval(interval);
      }
    }, 100);
  }

  registerEvents() {
    this.dropzone.addEventListener(
      'drop',
      (e) => {
        if (this.form.hasAttribute('disabled')) {
          return;
        }
        if (!this.data.fileName) {
          return;
        }
        this.data.file = e.dataTransfer.files[0];
        this.textInputPannel.hide();
      },
      false
    );

    this.fileInput.addEventListener('change', (e) => {
      this.data.file = e.target.files[0];
      this.textInputPannel.hide();
    });

    this.fileInput.addEventListener('click', (e) => {
      if (this.form.hasAttribute('disabled')) {
        e.stopImmediatePropagation();
        return false;
      }
      this.data.file = e.target.files[0];
      this.textInputPannel.hide();
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendFile();
    });

    this.textInput.addEventListener('change', (e) => {
      this.data.fileName = e.currentTarget.value;
    });

    this.clearTextButton.addEventListener('click', (e) => {
      this.data.fileName = '';
    });

    this.deleteAllButton.addEventListener('click', () => {
      this.data.file = null;
      this.data.fileName = '';
    });

    this.closeButton.addEventListener('click', () => {
      this.hideMessage();
    });
  }

  render() {
    this.shadow.innerHTML = template;

    this.initElements();
    this.registerEvents();
  }

  sendFile() {
    this.form.setAttribute('disabled', '');
    this.submitButton.setAttribute('disabled', '');
    this.fileInput.setAttribute('disabled', '');
    this.indicateProgress();
    const fd = new FormData();
    fd.append('file', this.data.file, this.fileNameWithExtension);
    fd.append('name', this.fileNameWithExtension);
    axios
      .post('https://file-upload-server-mc26.onrender.com/api/v1/upload', fd)
      .then((response) => {
        this.completeProgress();
        const message = `
          name: ${response.data.name}
          message: ${response.data.message}
          timestamp: ${response.data.timestamp}
        `;
        setTimeout(() => {
          this.showSuccess(message);
          this.data.file = null;
        this.data.fileName = '';
        }, 5000);
        
      })
      .catch((e) => {
        console.log(e);
        this.showError(e.message);
      })
      .finally(() => {
        setTimeout(() => {
          this.form.removeAttribute('disabled');
        this.submitButton.removeAttribute('disabled');
        this.fileInput.removeAttribute('disabled');
        this.dataPannel.classList.remove('sending');
        this.progressIndicator.classList.remove('animating');
        this.percents.innerHTML = '';
        }, 10000);
        
      });
  }
}

customElements.define('file-card', FileCard);
