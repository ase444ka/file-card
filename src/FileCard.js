import nestedStyle from './FileCard.css?inline';
import postcss from 'postcss';

const parsed = postcss.parse(nestedStyle);

const spriteURL = new URL('@/assets/images/sprites.svg#cross', import.meta.url)
  .href;
const dropzoneImgURL = new URL('@/assets/images/dropzone.svg', import.meta.url)
  .href;

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
    switch (prop) {
      case 'fileName':
        if (value) {
          if (this.data.file) {
            this.data.formDisabled = false
            this.setTooltip('Отправьте ваш файл');
          }
          this.setTooltip('Загрузите ваш файл');
        } else {
          this.setTooltip('Перед загрузкой дайте имя файлу ');
          this.data.formDisabled = true;
        }
        break;
      case 'file':
        if (!value) {
          this.data.formDisabled = true;
          return;
        }
        if (this.data.fileName) {
          this.data.formDisabled = false
          this.setTooltip('Отправьте ваш файл');
        }
        setTimeout(() => {
          this.checkExtension();
          this.checkSize();
        }, 0);

        break;
      case 'formDisabled':
        if (value) {
          this.submit.addAttribute('disabled');
        } else {
          this.submit.removeAttribute('disabled');
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
    this.shadow.innerHTML = /*jsx*/ `
    <style>${parsed}</style>
    
    <div class="file-card">
      
      <form class="file-card__form" id="file_form">
      <h3 class="file-card__title">Загрузочное окно</h3>
      <button class="file-card__close-button">
        <svg>
          <use href="${spriteURL}"></use>
        </svg>
      </button>
      <div class="file-card__tooltip">Перед загрузкой дайте имя файлу</div>
      <div class="file-card__input-wrapper">
        <input type="text" class="file-card__input" placeholder="Название файла" value="${this.data.fileName}" />
        <button class="file-card__clear-input">
          <svg>
            <use href="${spriteURL}"></use>
          </svg>
        </button>
      </div>
      <label class="file-card__dropzone">
        <img src="${dropzoneImgURL}" />
        <p>Перенесите ваш файл в область выше</p>
        <input class="file-card__file-input" type="file" accept=".json, .txt" />
      </label>
      <div class="file-card__info">
        <div class="file-card__marker"></div>
        <div class="file-card__data">
          <div class="file-card__filename">${this.data.fileName}.${this.fileExtension}</div>
          <div class="file-card__percents">30%</div>
          <div class="file-card__progress-bar">
            <div class="file-card__progress-indicator"></div>
          </div>
          
        </div>
        <button class="file-card__delete">
          <svg>
            <use href="${spriteURL}"></use>
          </svg>
        </button>
      </div>
      <button type="submit" disabled class="file-card__submit">Загрузить</button>
  
    </form>
    
  </div>
  `;

    this.fileInput = this.shadowRoot.querySelector('.file-card__file-input');
    this.form = this.shadowRoot.querySelector('.file-card__form');
    this.textInput = this.shadowRoot.querySelector('.file-card__input');
    this.clearButton = this.shadowRoot.querySelector('.file-card__clear-input');

    this.textInputPannel = this.shadowRoot.querySelector(
      '.file-card__input-wrapper'
    );
    this.tooltip = this.shadowRoot.querySelector('.file-card__tooltip');
    this.submit = this.shadowRoot.querySelector('.file-card__submit');

    this.shadowRoot.querySelector('.file-card__dropzone').addEventListener(
      'drop',
      (e) => {
        this.data.file = e.dataTransfer.files[0];
        this.textInputPannel.hide();
      },
      false
    );

    this.fileInput.addEventListener('change', (e) => {
      this.data.file = e.target.files[0];
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
    });

    this.textInput.addEventListener('change', (e) => {
      this.data.fileName = e.currentTarget.value;
    });

    this.clearButton.addEventListener('click', (e) => {
      this.data.fileName = '';
      this.textInput.value = '';
    });
  }

  sendFile() {
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

  connectedCallback() {
    this.makeDataProxy();
    this.shadow = this.attachShadow({mode: 'open'});
    this.render();
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
