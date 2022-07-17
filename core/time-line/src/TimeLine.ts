import { html, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export class TimeLine extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--time-line-text-color, #000);
    }

    .timeline ul li {
      list-style-type: none;
      position: relative;
      width: 3px;
      //margin: 0 auto;
      padding-top: 50px;
      background: #fff;
    }
    
    .timeline ul li::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: inherit;
    }
    
    .timeline ul li div {
      position: relative;
      bottom: 0;
      width: 600px;
      padding: 15px;
      background: #F45B69;
    }
    
    .timeline ul li div::before {
      content: '';
      position: absolute;
      bottom: 7px;
      width: 0;
      height: 0;
      border-style: solid;
    }
    
    .timeline ul li div {
      left: 45px;
    }
    
    .timeline ul li div::before {
      left: -15px;
      border-width: 8px 16px 8px 0;
      border-color: transparent #F45B69 transparent transparent;
    }
  `;

  @property({ type: String }) title = 'Hey there';

  render() {
    return html`
      <section class="timeline">
        <ul>
          <li>
            <div>
              <time>1934</time> At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
            </div>
          </li>
          <li>
            <div>
              <time>1937</time> Proin quam velit, efficitur vel neque vitae, rhoncus commodo mi. Suspendisse finibus mauris et bibendum molestie. Aenean ex augue, varius et pulvinar in, pretium non nisi.
            </div>
          </li>
          <li>
            <div>
              <time>1940</time> Proin iaculis, nibh eget efficitur varius, libero tellus porta dolor, at pulvinar tortor ex eget ligula. Integer eu dapibus arcu, sit amet sollicitudin eros.
            </div>
          </li>
          <li>
            <div>
              <time>1943</time> In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est.
            </div>
          </li>
          <li>
            <div>
              <time>1946</time> In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est.
            </div>
          </li>
          <li>
            <div>
              <time>1956</time> In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est.
            </div>
          </li>
          <li>
            <div>
              <time>1957</time> In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est.
            </div>
          </li>
          <li>
            <div>
              <time>1967</time> Aenean condimentum odio a bibendum rhoncus. Ut mauris felis, volutpat eget porta faucibus, euismod quis ante.
            </div>
          </li>
          <li>
            <div>
              <time>1977</time> Vestibulum porttitor lorem sed pharetra dignissim. Nulla maximus, dui a tristique iaculis, quam dolor convallis enim, non dignissim ligula ipsum a turpis.
            </div>
          </li>
          <li>
            <div>
              <time>1985</time> In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est.
            </div>
          </li>
          <li>
            <div>
              <time>2000</time> In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est.
            </div>
          </li>
          <li>
            <div>
              <time>2005</time> In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est.
            </div>
          </li>
        </ul>
      </section>
    `;
  }
}
