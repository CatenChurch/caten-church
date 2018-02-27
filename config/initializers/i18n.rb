# load config/locales/**/*.yml
# i18n yml can org by subfolder
Rails.application.config.i18n.load_path += Dir[Rails.root.join('config', 'locales', '**', '*.yml')]
