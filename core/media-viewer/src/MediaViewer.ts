import { html, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export class MediaViewer extends LitElement {
  static styles = css`
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');

    :host {
      display: block;
      color: var(--media-viewer-text-color, #000);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 60px;
      padding: 15px;
    }

    main {
      height: calc(100vh - 70px);
      display: flex;
      background-color: #f9f9f9;
    }

    .side-bar {
      height: 100%;
      width: 17%;
      background-color: white;
      overflow-y: hidden;
    }

    @media (max-width: 768px) {
      .side-bar {
        display: none;
      }
    }

    .left {
      display: flex;
      align-items: center;
    }
    
    .left #menu {
      padding: 0 7px;
      cursor: pointer;
     }

     .search {
      display: flex;
     }
     
     .search form {
      display: flex;
      border: 1px solid #ddd;
      height: 45px;
     }

     .search input {
      width: 600px;
      padding:10px;
      border: 0;
      height: 100%;
      border-radius: 2px 0 0 2px
    }
    
    input:focus {
      outline: none;
      border: 1px solid #ddd;
    }

    .search button {
      height: 100%;
      width: 60px;
      border: none;
    }
     
    .mic {
      margin-top: 10px;
    }

    .material-icons {
      color: rgb(100, 100, 100);
      padding: 0 7px;
      cursor: pointer;
    }

    .nav {
      width: 100%;
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
      margin-top: 15px;
    }

    hr {
      height: 1px;
      background-color: #e5e5e5;
      border: none;
    }

    .content {
      background-color: #f9f9f9;
      width: 100%;
      height: 100%;
      padding: 15px 15px;
      border-top: 1px solid #ddd;
      overflow-y: scroll;
    }
    
    .videos {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      flex-wrap: wrap;
    }
    
    .video {
      width: 270px;
      margin-bottom: 30px;
    }

    .thumbnail {
      width: 100%;
      height: 170px;
    }
    
    .thumbnail img {
      object-fit: cover;
      height: 94%;
      width: 100%;
    }
    .author img {
      object-fit: cover;
      border-radius: 50%;
      height: 40px;
      width: 40px;
      margin-right: 10px;
    }
    
    .details {
      display: flex;
    }
     
    .title {
      display: flex;
      flex-direction: column;
    }
     
    .title h3 {
      color: rgb(3, 3, 3);
      line-height: 18px;
      font-size: 14px;
      margin-bottom: 6px;
    }
     
    .title a,
    span {
      text-decoration: none;
      color: rgb(96, 96, 96);
      font-size: 12px;
    }

    @media (max-width: 768px) {
      .side-bar {
        display: none;
      }
      .search {
        display: none;
      }
  }

  @media (max-width: 900px) {
    .search input {
      width: 25rem;
    }
  }
  `;

  @property({ type: String }) title = 'Hey there';

  private videos: any[] = [{}];

  render() {
    return html`
      <header class="header">
        <div class="logo left">
          <i id="menu" class="material-icons">menu</i>
          <img src="https://www.freecodecamp.org/news/content/images/2022/01/yt-logo.png">
        </div>
        
        <div class="search center">
          <form action="">
            <input type="text" placeholder="Search" />
            <button><i class="material-icons">search</i></button>
          </form>
          <i class="material-icons mic">mic</i>
        </div>
        
        <div class="icons right">
          <i class="material-icons">videocam</i>
          <i class="material-icons">apps</i>
          <i class="material-icons">notifications</i>
          <i class="material-icons display-this">account_circle</i>
        </div>
      </header>
      <main>
          <div class="side-bar">
            <div class="nav">
              <a class="nav-link active">
                <i class="material-icons">home</i>
                <span>Home</span>
              </a>
              <a class="nav-link">
                <i class="material-icons">local_fire_department</i>
                <span>Trending</span>
              </a>
              <a class="nav-link">
                <i class="material-icons">subscriptions</i>
                <span>Subscriptions</span>
              </a>
            </div>
            <hr>
            <a class="nav-link">
              <i class="material-icons">library_add_check</i>
              <span>Library</span>
            </a>
            <a class="nav-link">
              <i class="material-icons">history</i>
              <span>History</span>
            </a>
            <a class="nav-link">
              <i class="material-icons">play_arrow</i>
              <span>Your Videos</span>
            </a>
            <a class="nav-link">
              <i class="material-icons">watch_later</i>
              <span>Watch Later</span>
            </a>
            <a class="nav-link">
              <i class="material-icons">thumb_up</i>
              <span>Liked Videos</span>
            </a>
          </div>
          <div class="content">
            <div class="videos">
              
            
                <!-- a video starts -->
                  <div class="video">
                    <div class="thumbnail">
                        <img src="https://img.youtube.com/vi/zUwB_imVjmg/maxresdefault.jpg" alt="" />
                      </div>
              
                        <div class="details">
                          <div class="author">
                              <img src="https://yt3.ggpht.com/bpzY-S4DYlbTeOpY5hIA7qz_hcbMkgvLAugtwKBGTTImNnWAGudX0y53bo_fJZ0auypxrWkUiw=s88-c-k-c0x00ffffff-no-rj" alt="" />
                          </div>
                          <div class="title">
                              <h3>
                                  Introverts & Content Creation | Sumudu Siriwardana
                              </h3>
                              <a href="">
                                      Francesco Ciulla
                                </a>
                                <span> 2M Views • 3 Months Ago </span>
                          </div>
                        </div>
              
                      </div>
                <!-- a video Ends -->


            </div>
          </div>
      </main>
    `;
  }
}
