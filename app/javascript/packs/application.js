/* eslint no-console:0 */
// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

// Import from node_modules
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Rails from '@rails/ujs'
import Turbolinks from 'turbolinks'
import $ from 'jquery'
import 'bootstrap/dist/js/bootstrap'
import Vue from 'vue/dist/vue.esm'
import '@fortawesome/fontawesome-free/js/all'

// Uncomment to copy all static images under ../images to the output folder and reference
// them with the image_pack_tag helper in views (e.g <%= image_pack_tag 'rails.png' %>)
// or the `imagePath` JavaScript helper below.
//
const images = require.context('../images', true)
// eslint-disable-next-line no-unused-vars
const imagePath = (name) => images(name, true)

// Expose libraries to window object
window.$ = $
window.Vue = Vue

// Using Rails default JavaScript packages
Rails.start()
Turbolinks.start()
