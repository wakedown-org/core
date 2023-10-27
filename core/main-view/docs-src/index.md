---
layout: page.11ty.cjs
title: <main-view> ⌲ Home
---

# &lt;main-view>

`<main-view>` is an awesome element. It's a great introduction to building web components with LitElement, with nice documentation site as well.

## As easy as HTML

<section class="columns">
  <div>

`<main-view>` is just an HTML element. You can it anywhere you can use HTML!

```html
<main-view></main-view>
```

  </div>
  <div>

<main-view></main-view>

  </div>
</section>

## Configure with attributes

<section class="columns">
  <div>

`<main-view>` can be configured with attributed in plain HTML.

```html
<main-view name="HTML"></main-view>
```

  </div>
  <div>

<main-view name="HTML"></main-view>

  </div>
</section>

## Declarative rendering

<section class="columns">
  <div>

`<main-view>` can be used with declarative rendering libraries like Angular, React, Vue, and lit-html

```js
import {html, render} from 'lit-html';

const name = 'lit-html';

render(
  html`
    <h2>This is a &lt;main-view&gt;</h2>
    <main-view .name=${name}></main-view>
  `,
  document.body
);
```

  </div>
  <div>

<h2>This is a &lt;main-view&gt;</h2>
<main-view name="lit-html"></main-view>

  </div>
</section>
