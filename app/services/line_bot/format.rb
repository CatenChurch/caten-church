# abstract class
class LineBot::Format
  attr_reader :type

  VALUES_TYPE = {}

  def initialize
    raise "#{self.class.name} is an abstract class"
  end

  def to_h
    valid_value_type
    as_json
  end

  private

  def valid_value_type
    VALUES_TYPE.each do |key, value|
      value_type(key, value)
    end
  end

  def value_type(value, klass)
    val = instance_variable_get(value)
    raise TypeError, "#{value} is #{val.class.name}, but expect #{klass}" unless val.is_a?(klass)
  end
end
