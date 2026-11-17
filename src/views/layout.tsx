import type { Child } from 'hono/jsx';
import { raw } from 'hono/html';
import type { ViewState } from '../app';
import { socialLinks, type Settings } from '../settings';

const BOOTSTRAP = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist';
const ICONS = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
const FONTS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;700&display=swap';

export interface Crumb {
  label: string;
  href: string;
}

export type NavKey = 'weeklies' | 'about' | 'contact' | 'tithing' | 'account';

export interface PageProps {
  settings: Settings;
  /** Who is signed in and the one-time message, from `viewState(c)`. */
  view: ViewState;
  /** Page title; omitted on the home page. */
  title?: string;
  description?: string;
  /** Navbar item to highlight. */
  active?: NavKey;
  breadcrumb?: Crumb[];
  /** Page heading and the line under it. */
  heading: string;
  lead?: Child;
  /** The home page shows the photo banner instead of the plain page header. */
  hero?: Child;
  children?: Child;
}

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'weeklies', label: '週報', href: '/weeklies' },
  { key: 'about', label: '關於我們', href: '/about' },
  { key: 'contact', label: '聚會與交通', href: '/contact' },
  { key: 'tithing', label: '奉獻', href: '/tithing' },
];

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
      <a class="btn btn-sm btn-outline-primary site-login" href="/login">
        會員登入
      </a>
    );
  }
  return (
    <div class="dropdown">
      <button
        class={`btn btn-sm site-account${active ? ' is-active' : ''} dropdown-toggle`}
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i class="bi bi-person-circle me-1"></i>
        {view.user.name ?? '會員中心'}
      </button>
      <div class="dropdown-menu dropdown-menu-end shadow-sm">
        <a class="dropdown-item" href="/account/profile">
          <i class="bi bi-person me-2"></i>個人資料
        </a>
        <a class="dropdown-item" href="/account/logins">
          <i class="bi bi-key me-2"></i>登入方式
        </a>
        {view.user.isAdmin && (
          <a class="dropdown-item" href="/admin">
            <i class="bi bi-speedometer2 me-2"></i>後台
          </a>
        )}
        <hr class="dropdown-divider" />
        <form method="post" action="/logout">
          <button type="submit" class="dropdown-item">
            <i class="bi bi-box-arrow-right me-2"></i>登出
          </button>
        </form>
      </div>
    </div>
  );
}

export function Page(props: PageProps) {
  const s = props.settings;
  const fullTitle = props.title ? `${props.title} | ${s.siteName}` : s.siteName;
  const description = props.description ?? s.siteDescription;
  const year = new Date().getFullYear();

  return (
    <html lang="zh-Hant">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#4a3570" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={s.siteName} />
        <meta property="og:title" content={props.title ?? s.siteName} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={s.shareImageUrl} />
        <link rel="icon" type="image/png" href={s.faviconUrl} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
        <link rel="stylesheet" href={`${BOOTSTRAP}/css/bootstrap.min.css`} />
        <link rel="stylesheet" href={ICONS} />
        <link rel="stylesheet" href="/app.css" />
        <script defer src={`${BOOTSTRAP}/js/bootstrap.bundle.min.js`}></script>
        <Analytics id={s.gaMeasurementId} />
      </head>
      <body>
        <a class="skip-link" href="#main">
          跳到主要內容
        </a>
        <header class="site-header">
          <nav class="navbar navbar-expand-md container">
            <a class="site-brand" href="/">
              <img src={s.logoUrl} width="36" height="36" alt="" />
              <span>{s.siteName}</span>
            </a>
            <button
              class="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#site-nav"
              aria-controls="site-nav"
              aria-expanded="false"
              aria-label="切換選單"
            >
              <i class="bi bi-list"></i>
            </button>
            <div class="collapse navbar-collapse" id="site-nav">
              <ul class="navbar-nav ms-auto site-nav">
                {NAV.map((item) => (
                  <li class="nav-item">
                    <a
                      class={`nav-link${props.active === item.key ? ' active' : ''}`}
                      href={item.href}
                      aria-current={props.active === item.key ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div class="site-account-slot">
                <AccountNav view={props.view} active={props.active === 'account'} />
              </div>
            </div>
          </nav>
        </header>

        {props.hero ?? (
          <section class="page-header">
            <div class="container">
              {props.breadcrumb && props.breadcrumb.length > 0 && (
                <nav aria-label="麵包屑">
                  <ol class="breadcrumb">
                    <li class="breadcrumb-item">
                      <a href="/">首頁</a>
                    </li>
                    {props.breadcrumb.map((crumb, i) =>
                      i === props.breadcrumb!.length - 1 ? (
                        <li class="breadcrumb-item active" aria-current="page">
                          {crumb.label}
                        </li>
                      ) : (
                        <li class="breadcrumb-item">
                          <a href={crumb.href}>{crumb.label}</a>
                        </li>
                      ),
                    )}
                  </ol>
                </nav>
              )}
              <h1>{props.heading}</h1>
              {props.lead && <div class="page-lead">{props.lead}</div>}
            </div>
          </section>
        )}

        <main id="main" class="site-main">
          {props.view.flash && (
            <div class="container">
              <div
                class={`alert ${props.view.flash.type === 'alert' ? 'alert-danger' : 'alert-success'} site-flash`}
                role="alert"
              >
                <i
                  class={`bi ${props.view.flash.type === 'alert' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}
                ></i>
                {props.view.flash.message}
              </div>
            </div>
          )}
          {props.children}
        </main>

        <footer class="site-footer">
          <div class="container">
            <div class="row g-4">
              <div class="col-12 col-lg-5">
                <div class="footer-brand">
                  <img src={s.logoUrl} width="40" height="40" alt="" />
                  <span>{s.siteName}</span>
                </div>
                <p class="footer-muted">{s.legalName}</p>
                <div class="footer-social">
                  {socialLinks(s).map((link) => (
                    <a href={link.url} aria-label={link.name}>
                      <i class={`bi bi-${link.icon}`}></i>
                    </a>
                  ))}
                </div>
              </div>
              <div class="col-12 col-sm-6 col-lg-4">
                <h2 class="footer-heading">聚會時間</h2>
                <ul class="footer-list">
                  <li>主日崇拜　{s.sundayService}</li>
                  <li>青少年團契　{s.youthFellowship}</li>
                  <li>辦公時間　{s.officeHours}</li>
                </ul>
              </div>
              <div class="col-12 col-sm-6 col-lg-3">
                <h2 class="footer-heading">聯絡我們</h2>
                <ul class="footer-list">
                  <li>
                    <a href={`tel:${s.phone}`}>{s.phone}</a>
                  </li>
                  <li>
                    <a href={`mailto:${s.email}`}>{s.email}</a>
                  </li>
                  <li>{s.address}</li>
                </ul>
              </div>
            </div>
            <div class="footer-bottom">
              <span>
                © 2014 – {year} {s.siteName}
              </span>
              <a href="/term">隱私條款</a>
            </div>
          </div>
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
  const first = Math.max(1, props.page - 2);
  const last = Math.min(props.totalPages, props.page + 2);
  const pages = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  return (
    <nav aria-label="分頁" class="site-pagination">
      <ul class="pagination flex-wrap justify-content-center">
        {props.page > 1 && (
          <li class="page-item">
            <a class="page-link" href={href(props.page - 1)} rel="prev">
              <i class="bi bi-chevron-left"></i>
              <span class="visually-hidden">上一頁</span>
            </a>
          </li>
        )}
        {pages.map((page) => (
          <li class={`page-item${page === props.page ? ' active' : ''}`}>
            <a
              class="page-link"
              href={href(page)}
              aria-current={page === props.page ? 'page' : undefined}
            >
              {page}
            </a>
          </li>
        ))}
        {props.page < props.totalPages && (
          <li class="page-item">
            <a class="page-link" href={href(props.page + 1)} rel="next">
              <i class="bi bi-chevron-right"></i>
              <span class="visually-hidden">下一頁</span>
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
