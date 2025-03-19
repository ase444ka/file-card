import '@/assets/style.css';
import javascriptLogo from './javascript.svg';
import viteLogo from '/vite.svg';
import {setupCounter} from './counter.js';
import FileCard from '@/FileCard.js'

document.querySelector('#app').innerHTML = /*jsx*/ `
  <file-card></file-card>
`;

setupCounter(document.querySelector('#counter'));
