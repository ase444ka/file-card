import '@/assets/style.css';
import FileCard from '@/FileCard'



document.querySelector('#app').innerHTML = /*jsx*/ `
  <file-card></file-card>
`;

document.querySelector('button').addEventListener('click', () => {
  document.querySelector('file-card').classList.remove('card__hidden')

})


document.querySelector('file-card').addEventListener('close', (e) => {
  e.target.classList.add('card__hidden')

})

