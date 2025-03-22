import {template} from './template.js';
import axios from 'axios';

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

// получение расширения файла из его названия
function getExtension(file) {
  return file?.name?.split('.')?.[1] || '';
}

export default class FileCard extends HTMLElement {
  constructor() {
    super();
    // данные, за изменениями которых надо следить
    this.data = {
      fileName: '',
      file: null,
      errorMessage: '',
      successMessage: '',
    };

    // html-шаблон
    this.template = template

    // данные для индикации процесса отправки
    this.currentIndicatorInterval = null;
    this.currentIndicatorPercents = 0;

    // подготовка к возможности реализации процедуры drug-n-drop
    prepareDropzone();
  }

  // пара простеньких геттеров для удобства
  get fileExtension() {
    return getExtension(this.data.file);
  }
  get fileNameWithExtension() {
    return `${this.data.fileName}.${this.fileExtension}`;
  }

  // при добавлении элемента в докумет вызывается этот метод, проксируются свойства, требующие наблюдения, рендерится shadow-dom
  connectedCallback() {
    this.makeDataProxy();
    this.shadow = this.attachShadow({mode: 'open'});
    this.render();
  }

  // создание автоматического реагирование на изменение свойств
  makeDataProxy() {
    this.data = new Proxy(this.data, {
      set: (target, prop, value, receiver) => {
        const val = this.handleChanges(prop, value);
        Reflect.set(target, prop, val, receiver);
        return true;
      },
    });
  }

    // рендер компонента
    render() {
      this.shadow.innerHTML = this.template;
      this.initElements();
      this.registerEvents();
    }

    // присвоение имен эленентам макета, для удобства обращения + создание методов для их удобного скрытия / показа
  initElements() {
    Element.prototype.hide = function () {
      this.classList.add('hidden');
    };

    Element.prototype.show = function () {
      this.classList.remove('hidden');
    };

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

  // регистрируем события
  registerEvents() {
    // сохранение файла из дропзоны, если не задано имя, не сохраняем файл, привлекаем внимание пользователя
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
      },
      false
    );

    // если пользователь хочет выбрать файл из файловой системы через интерфейс файл-инпута,
    // если нет имени файла, привлекаем внимание пользователя, что его надо задать
    this.dropzone.addEventListener(
      'click',
      (e) => {
        if (!this.data.fileName) {
          this.attractAttention();
        }
      },
      false
    );

    // сохранение файла через интерфейс файл-инпута
    this.fileInput.addEventListener('change', (e) => {
      this.data.file = e.target.files[0];
    });

    //  отправка файла на сабмит
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendFile();
    });

    // сохранение названия файла
    this.textInput.addEventListener('change', (e) => {
      this.data.fileName = e.currentTarget.value;
    });

    // очистка названия файла
    this.clearTextButton.addEventListener('click', (e) => {
      this.data.fileName = '';
    });

    // очистка названия файла и файла
    this.deleteAllButton.addEventListener('click', () => {
      this.data.file = null;
      this.data.fileName = '';
    });

    // скрытие сообщение об успехе/ошибке, или эмит компонентом события 'close'
    this.closeButton.addEventListener('click', () => {
      if (this.data.successMessage || this.data.errorMessage) {
        this.hideMessage();
      } else {
        this.shadowRoot.dispatchEvent(
          new CustomEvent('close', {
            bubbles: true,
            composed: true,
            detail: 'composed',
          })
        );
      }
    });
  }

  

  // обработчик проксированных свойств
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


  // вызывается при изменении имени файла
  handleFileName(value) {
    if (value) {
      // если задано имя, можно позволить пользователю загружать файл
      this.fileInput.removeAttribute('disabled');
      this.setTooltip('Перенесите ваш файл в область ниже');
    } else {
      // если имя файла удалили
      if (!this.data.fileName) {
        // если мы очищаем пустое поле, ничего не делаем (чтобы подсказка не мигала лишний раз)
        return value;
      }
      // если очищаем заполненное поле, запрещаем загружать файл, отображаем подсказку
      this.fileInput.setAttribute('disabled', '');
      this.setTooltip('Перед загрузкой дайте имя файлу');
      // синхронизируем поле ввода файла, очищаем его
      this.textInput.value = '';
      // удостовериваемся что поле ввода имени файла не скрыто
      this.textInputPannel.show();
    }
    return value;
  }

  //  вызывается при изменении файла для отправки
  handleFile(value) {
    // скрытие панели с информацией о файле, очистка поля ввода файла, запрет отправки формы
    const cleanUp = () => {
      this.infoPannel.hide();
      this.fileInput.value = null;
      this.submitButton.setAttribute('disabled', '');
    };
    // переменная для записи (или не записи) файла
    let result = null;
    if (!value) {
      // если удалили файл, проводим необходимую очистку
      cleanUp();
    } else {
      // проверяем не сформирует ли компонент сообщение об ошибке
      this.data.errorMessage =
        this.getBadExtensionMessage(value) || this.getBadSizeMessage(value);
      if (this.data.errorMessage) {
        // если да, не сохраняем файл,
        // проводим необходимую очистку
        cleanUp();
      } else {
        // если нет сообщений об ошибке, показываем панель с информацией о файле,
        // разрешаем отправку формы, сохраняем файл, скрываем поле ввода имени файла
        this.nameInfo.innerHTML = `${this.data.fileName}.${getExtension(
          value
        )}`;
        this.textInputPannel.hide();
        this.infoPannel.show();
        this.submitButton.removeAttribute('disabled');
        result = value;
      }
    }
    // возвращаем файл или пустую переменную
    return result;
  }

  // если приложение сгенерировало сообщение об ошибке, отображаем его пользователю
  handleErrorMessage(value) {
    if (value) {
      this.showError(value);
    }
    return value;
  }

  // если приложение сгенерировало сообщение об успехе, отображаем его пользователю
  handleSuccessMessage(value) {
    if (value) {
      this.showSuccess(value);
    }
    return value;
  }

  // проверка расширения файла и генерация сообщения об ошибке, если проверка провалилась
  getBadExtensionMessage(file) {
    if (!/\.(txt|json|csv)$/.test(file?.name || '')) {
      return 'Допустимы только расширения .txt, .json и .csv';
    }
    return '';
  }

  // проверка размера файла и генерация сообщения об ошибке, если проверка провалилась
  getBadSizeMessage(file) {
    if (file?.size > 1024) {
      return 'Допустимый размер до 1Кб';
    }
    return '';
  }

    // задание текста подсказки
    setTooltip(value) {
      this.smoothTextChange(this.tooltip, value);
    }
  
    // задание текста заголовка
    setTitle(value) {
      this.smoothTextChange(this.header, value);
    }

  // плавное изменение текста в элементе
  smoothTextChange(element, value) {
    element.classList.add('transparent');
    setTimeout(() => {
      element.innerHTML = value;
      element.classList.remove('transparent');
    }, 150);
  }



  // отображение уведомления об успехе
  showSuccess(message) {
    this.form.classList.add('user-message');
    this.setTitle('Файл успешно загружен');
    this.setTooltip(message);
  }

  // отображение уведомления об ошибке
  showError(message) {
    this.form.classList.add('user-message');
    this.form.classList.add('user-error');
    this.setTitle('Ошибка загрузки');
    this.setTooltip(message);
  }

  // метод для скрытия окна уведомления пользователей об успехе/ошибке
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
        : 'Перенесите ваш файл в область ниже';
      this.setTooltip(message);
    }
  }

  

  

  


  // привлечение внимания пользователя к подсказке
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

  

  async sendFile() {
    // подготовка интерфейса к отправке
    this.indicateProgress();
    this.disableAll();
    // подготовка данных для отправки
    const fd = new FormData();
    fd.append('file', this.data.file, this.fileNameWithExtension);
    fd.append('name', this.fileNameWithExtension);

    // попытка отправки
    try {
      const response = await axios.post(
        'https://file-upload-server-mc26.onrender.com/api/v1/upload',
        fd
      );
      // когда пришел ответ, "доползаем ползунок"
      await this.completeProgress();
      // и выводим сообщение об успехе
      this.data.successMessage = `name: ${response.data.name}\nmessage: ${response.data.message}\ntimestamp: ${response.data.timestamp}`;
    } catch (e) {
      // в случае ошибки, не ждем ползунок, выводим сообщение об ошибке
      this.data.errorMessage = e.response?.data?.error || e.message;
    } finally {
      this.finalCleanup();
    }
  }

  // отображение прогресса отправки файла проходит в 3 этапа, это первые два
  indicateProgress() {
    // до 70% анимируем прогресс быстро, потом ползунок ползет медленнее
    // (реализовано в css). класс sending показывает ползунок и блокирует кнопку удаления файла
    // класс animating отображает анимации
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
          // если ползунок дополз до 95%, но сервер еще ничего не ответил
          // ползунок принимает вид наподобие скелетона (класс waiting)
          if (this.currentIndicatorPercents > 94) {
            clearInterval(this.currentIndicatorInterval);
            this.progressIndicator.classList.remove('animating');
            this.progressIndicator.classList.add('waiting');
          }
        }, 900);
      }
    }, 100);
  }

  // метод вызывается когда сервер прислал ответ, чтобы довести ползунок до конца
  async completeProgress(response) {
    clearInterval(this.currentIndicatorInterval);
    return new Promise((res) => {
      // добавляем новый класс для новой анимации, старые удаляем
      this.progressIndicator.classList.remove('animating');
      this.progressIndicator.classList.remove('waiting');
      this.progressIndicator.classList.add('completing');
      const lastPersents = 100 - this.currentIndicatorPercents;
      // отображаем бег процентов с расчетом скорости, учитывая сколько осталось процентов, в течение секунды
      this.currentIndicatorInterval = setInterval(() => {
        this.percents.innerHTML = this.currentIndicatorPercents + '%';
        this.currentIndicatorPercents += 1;
        if (this.currentIndicatorPercents > 100) {
          this.percents.innerHTML = '100%';
          clearInterval(this.currentIndicatorInterval);
          this.currentIndicatorInterval = null;
          // отображаем в течение 300мс результат 100% и после резольвим ответ сервера для дальнейших действий
          setTimeout(() => {
            res(response);
          }, 300);
        }
      }, Math.floor(1000 / lastPersents));
    });
  }

  // очистка индикатора процентов загрузки: остановка таймера, если он запущен, очистка
  // поля с процентами, снятие всех стилей загрузки
  clearIndicator() {
    if (this.currentIndicatorInterval) {
      clearInterval(this.currentIndicatorInterval);
    }
    this.currentIndicatorPercents = 0;
    this.percents.innerHTML = '';

    this.progressIndicator.classList.remove('animating');
    this.progressIndicator.classList.remove('waiting');
    this.progressIndicator.classList.remove('completing');
  }

  // очистка всего после попытки отправки файла
  finalCleanup() {
    // очистка индикатора загрузки
    this.clearIndicator();

    // разблокировка кнопок и инпутов
    this.form.removeAttribute('disabled');
    this.submitButton.removeAttribute('disabled');
    this.closeButton.removeAttribute('disabled', '');
    this.fileInput.removeAttribute('disabled');
    this.dataPannel.classList.remove('sending');
  }

  // блокировка всего на время отправки
  disableAll() {
    this.form.setAttribute('disabled', '');
    this.submitButton.setAttribute('disabled', '');
    this.fileInput.setAttribute('disabled', '');
    this.closeButton.setAttribute('disabled', '');
  }
}

customElements.define('file-card', FileCard);
