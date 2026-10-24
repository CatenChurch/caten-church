// Entry point for the build script in package.json (esbuild, see jsbundling-rails).
// Loaded on every page from app/views/shared/_header.html.erb.

// Hotwire Turbo: replaces Turbolinks and rails-ujs
// (links use data-turbo-method / data-turbo-confirm, forms use data-turbo-submits-with).
import '@hotwired/turbo-rails'

// Bootstrap 5 (no jQuery). Exposed on window for inline scripts.
import * as bootstrap from 'bootstrap'

// Font Awesome (SVG + JS), keeps the `fas fa-*` / `fab fa-*` class names working.
import '@fortawesome/fontawesome-free/js/all'

import './lib/active_nav'

window.bootstrap = bootstrap
