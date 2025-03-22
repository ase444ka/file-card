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
      errorMessage: '',
      successMessage: '',
    };

    this.currentIndicatorInterval = null;
    this.currentIndicatorPercents = 0;

    prepareDropzone();
    window.test = this;
  }

  get fileExtension() {
    return this.getExtension(this.data.file);
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
        const val = this.handleChanges(prop, value);
        Reflect.set(target, prop, val, receiver);
        return true;
      },
    });
  }

  getExtension(file) {
    return file?.name?.split('.')?.[1] || '';
  }

  handleChanges(prop, value) {
    switch (prop) {
      case 'fileName':
        return this.handleFileName(value);
      case 'file':
        return this.handleFile(value);
      case 'errorMessage':
        return this.handleErrorMessage(value);
      case 'successMessage':
        return this.handleSuccessMessage(value);
    }
  }

  handleFileName(value) {
    if (value) {
      this.fileInput.removeAttribute('disabled');
      this.setTooltip('Загрузите ваш файл');
    } else {
      if (!this.data.fileName) {
        return value;
      }
      this.fileInput.setAttribute('disabled', '');
      this.setTooltip('Перед загрузкой дайте имя файлу');
      this.textInput.value = '';
      this.textInputPannel.show();
    }
    return value;
  }

  handleFile(value) {
    if (!value) {
      this.infoPannel.hide();
      this.fileInput.value = null;
      this.submitButton.setAttribute('disabled', '');
      return null;
    } else {
      this.data.errorMessage =
        this.getBadExtensionMessage(value) || this.getBadSizeMessage(value);
      if (this.data.errorMessage) {
        this.fileInput.value = null;
        return null;
      }
      this.nameInfo.innerHTML = `${this.data.fileName}.${this.getExtension(
        value
      )}`;

      this.infoPannel.show();
      this.submitButton.removeAttribute('disabled');
      return value;
    }
  }

  handleErrorMessage(value) {
    if (value) {
      this.showError(value);
    }
    return value;
  }

  handleSuccessMessage(value) {
    if (value) {
      this.showSuccess(value);
    }
    return value;
  }

  getBadExtensionMessage(file) {
    if (!/\.(txt|json|csv)$/.test(file?.name || '')) {
      return 'Допустимы только расширения .txt, .json и .csv';
    }
    return '';
  }

  getBadSizeMessage(file) {
    if (file?.size > 1024) {
      return 'Допустимый размер до 1Кб';
    }
    return '';
  }

  setTooltip(value) {
    this.tooltip.classList.add('transparent');
    setTimeout(() => {
      this.tooltip.innerHTML = value;
      this.tooltip.classList.remove('transparent');
    }, 150);
  }
  setTitle(value) {
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
    this.setTitle('Окно загрузки');
    this.form.classList.remove('user-message');

    if (this.data.successMessage) {
      this.data.successMessage = '';
      this.data.file = null;
      this.data.fileName = '';
    }
    if (this.data.errorMessage) {
      this.data.errorMessage = '';
      this.form.classList.remove('user-error');
      const message = this.data.fileName
        ? 'Загрузите ваш файл'
        : 'Перед загрузкой дайте имя файлу';
      this.setTooltip(message);
    }
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
    this.currentIndicatorInterval = setInterval(() => {
      this.percents.innerHTML = (this.currentIndicatorPercents || 1) + '%';
      this.currentIndicatorPercents += 5;
      if (this.currentIndicatorPercents > 70) {
        this.currentIndicatorPercents = 71;
        clearInterval(this.currentIndicatorInterval);
        this.currentIndicatorInterval = setInterval(() => {
          this.currentIndicatorPercents += 1;
          this.percents.innerHTML = this.currentIndicatorPercents + '%';
          if (this.currentIndicatorPercents > 95) {
            clearInterval(this.currentIndicatorInterval);
            this.progressIndicator.classList.remove('animating');
            this.progressIndicator.classList.add('waiting');
          }
        }, 900);
      }
    }, 100);
  }

  async completeProgress(response) {
    clearInterval(this.currentIndicatorInterval);
    return new Promise((res) => {
      this.progressIndicator.classList.remove('animating');
      this.progressIndicator.classList.remove('waiting');
      this.progressIndicator.classList.add('completing');
      const lastPersents = 100 - this.currentIndicatorPercents;
      this.currentIndicatorInterval = setInterval(() => {
        this.percents.innerHTML = this.currentIndicatorPercents + '%';
        this.currentIndicatorPercents += 1;
        if (this.currentIndicatorPercents > 100) {
          this.percents.innerHTML = '100%';
          clearInterval(this.currentIndicatorInterval);
          this.currentIndicatorInterval = null;
          setTimeout(() => {
            res(response);
          }, 300);
        }
      }, Math.floor(1000 / lastPersents));
    });
  }

  registerEvents() {
    this.dropzone.addEventListener(
      'drop',
      (e) => {
        if (this.form.hasAttribute('disabled')) {
          return;
        }
        if (!this.data.fileName) {
          this.attractAttention();

          return;
        }
        this.data.file = e.dataTransfer.files[0];
        this.textInputPannel.hide();
      },
      false
    );

    this.dropzone.addEventListener(
      'click',
      (e) => {
        if (this.form.hasAttribute('disabled')) {
          return;
        }
        if (!this.data.fileName) {
          this.attractAttention();
        }
      },
      false
    );

    this.fileInput.addEventListener('change', (e) => {
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

  attractAttention() {
    const handleAnimationEnd = (event) => {
      event.stopPropagation();
      this.tooltip.classList.remove('animate__headShake');
    };
    this.tooltip.classList.add('animate__headShake');
    this.tooltip.addEventListener('animationend', handleAnimationEnd, {
      once: true,
    });
    
  }

  clearIndicator() {
    if (this.currentIndicatorInterval) {
      clearInterval(this.currentIndicatorInterval);
    }

    this.currentIndicatorPercents = 0;
  }

  async sendFile() {
    this.form.setAttribute('disabled', '');
    this.submitButton.setAttribute('disabled', '');
    this.fileInput.setAttribute('disabled', '');
    this.indicateProgress();
    const fd = new FormData();
    fd.append('file', this.data.file, this.fileNameWithExtension);
    fd.append('name', this.fileNameWithExtension);

    try {
      const response = await axios.post(
        'https://file-upload-server-mc26.onrender.com/api/v1/upload',
        fd
      );

      await this.completeProgress();
      this.data.successMessage = `name: ${response.data.name}\nmessage: ${response.data.message}\ntimestamp: ${response.data.timestamp}`;
    } catch (e) {
      this.data.errorMessage = e.response?.data?.error || e.message;
      this.clearIndicator();
    } finally {
      this.clearIndicator();
      this.form.removeAttribute('disabled');
      this.submitButton.removeAttribute('disabled');
      this.fileInput.removeAttribute('disabled');
      this.dataPannel.classList.remove('sending');
      this.progressIndicator.classList.remove('animating');
      this.progressIndicator.classList.remove('waiting');
      this.progressIndicator.classList.remove('completing');
      this.percents.innerHTML = '';
    }
  }
}

customElements.define('file-card', FileCard);
