import { html, css, LitElement } from "lit";
import { property, queryAll } from "lit/decorators.js";

export class MainLayout extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      color: var(--main-layout-text-color, #000);
    }

    .everybody {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: none;
    }

    .everybody > * {
      padding: 10px;
    }

    .everybody header {
      width: 100%;
      order: 1;
    }

    .everybody header, .everybody header a {
      display: flex;
      flex-direction: row wrap;
      justify-content: flex-start;
      align-items: center;
    }

    .everybody .title {
      margin: 0 1em;
      font-size: 30px;
    }

    .everybody header > * {
      flex: 1 100%;
    }

    .everybody header a {
      margin-left: 1em;
      text-decoration: none;
      color: var(--main-layout-text-color, #000);
    }

    .everybody .main {
      text-align: left;
      flex: 1;
      width: 100%;
      order: 2;
      overflow: auto;
    }

    .everybody footer {
      display: none;
      justify-content: center;
      align-content: center;
      width: 100%;
      order: 3;
      text-align: center;
      font-size: .8em;
      align-self: flex-end;
    }

    .everybody nav, .everybody nav ul {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-end;

      list-style: none;
      margin: 0;
      padding: 0 1em;
    }

    .everybody nav a {
      text-decoration: none;
      padding: 1em;
    }
  `;

  @property({ type: String }) title = 'Hey there';
  @property({ type: Object }) navList: { [key:string]: () => void } = { };

  render() {
    return html`
      <div class="everybody">
        <header>
          <a href="#">
            <slot name="logo"></slot>
            <h2 class="title">${this.title}</h2>
          </a>
          <nav>
            <ul>
              ${Object.keys(this.navList).map((item) => html`
                <li><a @click=${this.navList[item]}>${item}</a></li>
              `)}
            </ul>
          </nav>
        </header>
        <section class="main">
          <slot></slot>
        </section>
        <footer>
          powered by me
        </footer>
      </div>
    `;
  }
}
