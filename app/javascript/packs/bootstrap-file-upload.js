import bsCustomFileInput from 'bs-custom-file-input'

bsCustomFileInput.init()
document.addEventListener('turbolinks:load', () => {
  bsCustomFileInput.init()
})
