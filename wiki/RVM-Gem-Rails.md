Mac Os X 內建的 Ruby 版本老舊(只是為了讓系統能正常的運行)，所以需要安裝 [RVM](https://rvm.io/)。可以透過 RVM 安裝多個版本的 Ruby，並且自由地切換，RVM 還能把使用的外部函式庫 gem 用各個 gemset 切開，保持開發環境的乾淨。

# Install RVM

請連至 <https://rvm.io/> 跟著官網的指令下載最新的 RVM

# Install Ruby 2.3

列出所有版本的 Ruby

```bash
$ rvm list known
```

安裝 2.3 版 Ruby

```bash
$ rvm install 2.3
```

預設使用 2.3 版 Ruby

```bash
$ rvm --default use 2.3
```

# Gem

Gem 就是 Ruby 開發者共享的函式庫，Rails 也是 Ruby 的一個 Gem

設定安裝 Gem 時不要安裝文檔，於 `~/.gemrc` 加上這行

```text
# .gemrc
gem: --no-rdoc --no-ri
```

使用 gemset 讓開發環境可以隔離不互相干擾，每個 RVM 安裝的 Ruby 版本都有預設的 gemset，我們也可以自己建立 gemset

```bash
$ rvm gemset create rails501
# 使用建立的 rails501 gemset
$ rvm use 2.3@rails501
# 切回預設的 gemset
$ rvm use 2.3@default
```

# Install Rails 5.0.1

因為此網站是 Rails 5.0.1

```bash
$ gem install rails -v 5.1.4
```

若想安裝最新的 Rails

```bash
$ gem install rails
```
