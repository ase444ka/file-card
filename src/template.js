import nestedStyle from './FileCard.css?inline';
import postcss from 'postcss';
import nestedAnimate from 'animate.css?inline'

const parsed = postcss.parse(nestedStyle);
const parsedAnimations = postcss.parse(nestedAnimate)

const spriteURL = new URL('@/assets/images/sprites.svg#cross', import.meta.url)
  .href;
const dropzoneImgURL = new URL('@/assets/images/dropzone.svg', import.meta.url)
  .href;
export const template = /*jsx*/ `
<style>${parsed}${parsedAnimations}</style>

<div class="file-card">
  
  <form class="file-card__form" id="file_form">
  <h3 class="file-card__title">Загрузочное окно</h3>
  <button class="file-card__close-button" type="button">
    <svg>
      <use href="${spriteURL}"></use>
    </svg>
  </button>
  <div class="file-card__tooltip">Перед загрузкой дайте имя файлу</div>
  <div class="file-card__input-wrapper">
    <input type="text" class="file-card__input" placeholder="Название файла" />
    <button class="file-card__clear-input"  type="button">
      <svg>
        <use href="${spriteURL}"></use>
      </svg>
    </button>
  </div>
  <label class="file-card__dropzone">
    <img src="${dropzoneImgURL}" />
    <p>Перенесите ваш файл в область выше</p>
    <input class="file-card__file-input" type="file" accept=".json, .txt" disabled />
  </label>
  <div class="file-card__info hidden">
    <div class="file-card__marker"></div>
    <div class="file-card__data">
      <div class="file-card__filename"></div>
      <div class="file-card__percents"></div>
      <div class="file-card__progress-bar">
        <div class="file-card__progress-indicator"></div>
      </div>
      
    </div>
    <button class="file-card__delete"  type="button">
      <svg>
        <use href="${spriteURL}"></use>
      </svg>
    </button>
  </div>
  <button type="submit" disabled class="file-card__submit">Загрузить</button>

</form>


</div>
`;
