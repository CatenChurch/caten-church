# frozen_string_literal: true

module SharedHelper
  def nav_item_link_to(path, **options)
    options[:class] ||= ''
    options[:class] += ' nav-item nav-link'
    options[:class] += ' d-flex align-items-center justify-content-between'
    link_to path, **options do
      yield if block_given?
    end
  end
end
