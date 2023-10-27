---
layout: example.11ty.cjs
title: <main-view> ⌲ Examples ⌲ Basic
tags: example
name: Basic
description: A basic example
---

<style>
  main-view p {
    border: solid 1px blue;
    padding: 8px;
  }
</style>
<main-view>
  <p>This is child content</p>
</main-view>

<h3>CSS</h3>

```css
p {
  border: solid 1px blue;
  padding: 8px;
}
```

<h3>HTML</h3>

```html
<main-view>
  <p>This is child content</p>
</main-view>
```
