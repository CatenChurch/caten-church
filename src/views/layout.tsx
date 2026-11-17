import type { Child } from 'hono/jsx';
import { raw } from 'hono/html';
import type { ViewState } from '../app';
import type { Settings } from '../settings';

const BOOTSTRAP = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist';
const ICONS = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';

export interface Crumb {
  label: string;
  href: string;
}

export interface PageProps {
  settings: Settings;
  /** Who is signed in and the one-time message, from `viewState(c)`. */
  view: ViewState;
  /** Page title; omitted on the home page. */
  title?: string;
  description?: string;
  /** Navbar item to highlight. */
  active?: 'weeklies' | 'events' | 'groups' | 'account';
  breadcrumb?: Crumb[];
  /** Large heading and lead text shown over the hero image. */
  heading: string;
  lead?: Child;
  children?: Child;
}

function Analytics({ id }: { id: string }) {
  if (!/^[A-Z0-9-]+$/.test(id)) return null;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`}></script>
      <script>
        {raw(
          `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`,
        )}
      </script>
    </>
  );
}

function AccountNav({ view, active }: { view: ViewState; active: boolean }) {
  if (!view.user) {
    return (
      <a class="nav-link" href="/login">
        <i class="bi bi-box-arrow-in-right me-1"></i>登入
      </a>
    );
  }
  return (
    <>
      <div class="nav-item dropdown">
        <a
          class={`nav-link dropdown-toggle${active ? ' active' : ''}`}
          href="#"
          role="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i class="bi bi-person me-1"></i>
          {view.user.name ?? '會員中心'}
        </a>
        <div class="dropdown-menu dropdown-menu-end">
          <a class="dropdown-item" href="/account/profile">
            個人資料
          </a>
          <a class="dropdown-item" href="/account/logins">
            登入方式
          </a>
          {view.user.isAdmin && (
            <>
              <hr class="dropdown-divider" />
              <a class="dropdown-item" href="/admin">
                後台
              </a>
            </>
          )}
        </div>
      </div>
      <form method="post" action="/logout" class="d-flex">
        <button type="submit" class="nav-link btn btn-link">
          <i class="bi bi-box-arrow-right me-1"></i>登出
        </button>
      </form>
    </>
  );
}

export function Page(props: PageProps) {
  const s = props.settings;
  const fullTitle = props.title ? `${props.title} | ${s.siteName}` : s.siteName;
  const description = props.description ?? s.siteDescription;
  const navClass = (key: PageProps['active']) => `nav-link${props.active === key ? ' active' : ''}`;

  return (
    <html lang="zh-Hant">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={s.siteName} />
        <meta property="og:title" content={props.title ?? s.siteName} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={s.shareImageUrl} />
        <link rel="icon" type="image/png" href={s.faviconUrl} />
        <link rel="stylesheet" href={`${BOOTSTRAP}/css/bootstrap.min.css`} />
        <link rel="stylesheet" href={ICONS} />
        <link rel="stylesheet" href="/app.css" />
        <script defer src={`${BOOTSTRAP}/js/bootstrap.bundle.min.js`}></script>
        <Analytics id={s.gaMeasurementId} />
      </head>
      <body>
        <nav class="navbar navbar-expand-md bg-light">
          <div class="container-fluid">
            <a class="navbar-brand" href="/">
              <img src={s.logoUrl} height="30" alt="" /> {s.siteName}
            </a>
            <button
              class="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbar-content"
              aria-controls="navbar-content"
              aria-expanded="false"
              aria-label="切換選單"
            >
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbar-content">
              <div class="navbar-nav ms-auto">
                <a class={navClass('weeklies')} href="/weeklies">
                  <i class="bi bi-newspaper me-1"></i>週報
                </a>
                <a class={navClass('events')} href="/events">
                  <i class="bi bi-calendar-event me-1"></i>活動
                </a>
                <a class={navClass('groups')} href="/groups">
                  <i class="bi bi-people me-1"></i>小組
                </a>
                <AccountNav view={props.view} active={props.active === 'account'} />
              </div>
            </div>
          </div>
        </nav>

        <div class="hero" style={`background-image: url("${encodeURI(s.heroImageUrl)}")`}>
          <div class="hero-panel d-inline-block ms-4 mb-4 p-2 rounded">
            <a href="/">首頁</a>
            {(props.breadcrumb ?? []).map((crumb) => (
              <>
                {' > '}
                <a href={crumb.href}>{crumb.label}</a>
              </>
            ))}
          </div>
          <div class="d-flex justify-content-center">
            <div class="hero-panel p-5 rounded text-center">
              <h1 class="display-4">{props.heading}</h1>
              {props.lead}
            </div>
          </div>
        </div>

        {props.view.flash && (
          <div
            class={`alert ${props.view.flash.type === 'alert' ? 'alert-danger' : 'alert-success'} rounded-0 mb-0 text-center`}
            role="alert"
          >
            {props.view.flash.message}
          </div>
        )}
        <main class="p-4">{props.children}</main>

        <footer class="bg-light p-2 text-center">
          <div class="container p-2">
            <div class="d-flex flex-wrap align-items-center justify-content-between">
              <h5>
                <a class="text-decoration-none text-dark" href="/about">
                  關於茄典
                </a>
              </h5>
              <h5>
                <a class="text-decoration-none text-dark" href="/contact">
                  聯絡我們
                </a>
              </h5>
              <h5>
                <a class="text-decoration-none text-dark" href="/term">
                  隱私條款
                </a>
              </h5>
              <div class="w-100 d-sm-none"></div>
              <a
                class="text-decoration-none text-dark fs-1"
                href={s.facebookUrl}
                aria-label="Facebook"
              >
                <i class="bi bi-facebook"></i>
              </a>
              <a
                class="text-decoration-none text-dark fs-1"
                href={s.youtubeUrl}
                aria-label="YouTube"
              >
                <i class="bi bi-youtube"></i>
              </a>
              <a class="text-decoration-none text-dark fs-1" href={s.githubUrl} aria-label="GitHub">
                <i class="bi bi-github"></i>
              </a>
            </div>
            <div class="row mt-2 align-items-center">
              <div class="col-12 col-md-6 text-muted p-2">
                <div>主日崇拜：{s.sundayService}</div>
                <div>上班時間：{s.officeHours}</div>
              </div>
              <div class="col-12 col-md-6 p-2">
                <div class="lead text-purple">{s.phone}</div>
                <a class="text-decoration-none text-dark" href={`mailto:${s.email}`}>
                  {s.email}
                </a>
                <div>{s.address}</div>
              </div>
            </div>
          </div>
          © 2014 - {new Date().getFullYear()} Hong Xin Yang.
        </footer>
      </body>
    </html>
  );
}

/** Rails `simple_format`: blank lines split paragraphs, single newlines become `<br>`. */
export function SimpleFormat({ text }: { text: string | null | undefined }) {
  const paragraphs = (text ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .filter((p) => p.trim() !== '');
  return (
    <>
      {paragraphs.map((paragraph) => (
        <p>
          {paragraph.split('\n').map((line, i) => (
            <>
              {i > 0 && <br />}
              {line}
            </>
          ))}
        </p>
      ))}
    </>
  );
}

export function Pagination(props: {
  page: number;
  totalPages: number;
  path: string;
  /** Other query parameters to keep on every page link, without the leading `?`. */
  query?: string;
}) {
  if (props.totalPages <= 1) return null;
  const href = (page: number) => {
    const params = [props.query, page === 1 ? '' : `page=${page}`].filter(Boolean).join('&');
    return params ? `${props.path}?${params}` : props.path;
  };
  const first = Math.max(1, props.page - 4);
  const last = Math.min(props.totalPages, props.page + 4);
  const pages = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  return (
    <nav aria-label="分頁">
      <ul class="pagination flex-wrap">
        {props.page > 1 && (
          <li class="page-item">
            <a class="page-link" href={href(props.page - 1)} rel="prev">
              上一頁
            </a>
          </li>
        )}
        {pages.map((page) => (
          <li class={`page-item${page === props.page ? ' active' : ''}`}>
            <a class="page-link" href={href(page)}>
              {page}
            </a>
          </li>
        ))}
        {props.page < props.totalPages && (
          <li class="page-item">
            <a class="page-link" href={href(props.page + 1)} rel="next">
              下一頁
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
