
import nestedStyle from "./FileCard.css?inline"
import postcss from 'postcss'

const parsed = postcss.parse(nestedStyle)

const spriteURL = new URL('@/assets/images/sprites.svg#cross', import.meta.url).href
const dropzoneImgURL = new URL('@/assets/images/dropzone.svg', import.meta.url).href

const processDrop = e => {
  e.preventDefault();
  console.log('drop!')
}

export default class FileCard extends HTMLElement {
  constructor() {
    super()
    this.data = {
      fileName: '',
      fileExtension: '',
      file: null,

    }
    this.tooltip = 'Перед загрузкой дайте имя файлу'
    this.content = null
    const events = ['dragenter', 'dragover', 'dragleave', 'drop']
    function preventDefaults(e) {
        e.preventDefault()
        e.stopPropagation();
    }
    events.forEach(eventName => {
      document.body.addEventListener(eventName, preventDefaults, false)
  })
  }
  makeDataProxy() {
    this.data = new Proxy(this.data, {
      set: (target, prop, value, receiver) => {
        Reflect.set(target, prop, value, receiver)
        this.render()
        return true
      },
    })
  }

  render() {

    this.shadow.innerHTML = /*jsx*/`
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
      <label class="file-card__dropzone" ondrop="processDrop">
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
  `

  this.shadowRoot.querySelector('.file-card__dropzone').addEventListener('drop', e => {
    console.log(JSON.stringify(e.dataTransfer.files[0].name))
    const fd = new FormData()
    this.fileExtension = e.dataTransfer.files[0].name.split('.')?.[1]
    console.log('иииииээ', this.fileName, '.', this.fileExtension)
    fd.append('file', e.dataTransfer.files[0], 'test.json')
    fd.append('name', 'test.json')
    fetch('https://file-upload-server-mc26.onrender.com/api/v1/upload', {
      method: 'POST',
      body: fd,

    }).then(() => {
      console.log('success', res)
    }).catch(() => {console.log('bad^(')}).finally(() => console.log('finally'));
  
}, false)
  

  this.shadowRoot.querySelector('.file-card__file-input').addEventListener('change', e => {
    console.log(e)
  })

  this.shadowRoot.querySelector('.file-card__form').addEventListener('submit', e => {
    e.preventDefault()
  })

  this.shadowRoot.querySelector('.file-card__input').addEventListener('change', e => {
    this.data.fileName = e.currentTarget.value
  })

  this.shadowRoot.querySelector('.file-card__clear-input').addEventListener('click', e => {
    this.data.fileName = ''
    console.log(this.data.fileName)
  })

  }

  connectedCallback() {
    this.makeDataProxy()
    this.shadow = this.attachShadow({mode: 'open'});
    this.render()


  
}
}
  

customElements.define('file-card', FileCard);
