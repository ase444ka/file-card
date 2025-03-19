
import nestedStyle from "./FileCard.css?inline"
import postcss from 'postcss'

const parsed = postcss.parse(nestedStyle)

const spriteURL = new URL('@/assets/images/sprites.svg#cross', import.meta.url).href
const dropzoneImgURL = new URL('@/assets/images/dropzone.svg', import.meta.url).href

export default class FileCard extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({mode: 'open'});
    const styleURL = new URL('@/assets/style.css', import.meta.url).href
    shadow.innerHTML = /*jsx*/`
    <style>${parsed}</style>
    
    <div class="file-card">
      
    <form class="file-card__form" onsubmit="e => e.preventDefault()">
      <h3 class="file-card__title">Загрузочное окно</h3>
      <button class="file-card__close-button">
        <svg>
          <use href="${spriteURL}"></use>
        </svg>
      </button>
      <div class="file-card__tooltip">Перед загрузкой дайте имя файлу</div>
      <div class="file-card__input-wrapper">
        <input type="text" class="file-card__input" placeholder="Название файла" />
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
          <div class="file-card__filename">Безымянный.txt</div>
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
  }
}

customElements.define('file-card', FileCard);
