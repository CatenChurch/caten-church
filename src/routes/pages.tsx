import { Hono } from 'hono';
import { getSettings, viewState, type AppEnv } from '../app';
import { findLatestWeekly } from '../data/weeklies';
import { formatDate, taipeiDateParts } from '../format';
import { Page } from '../views/layout';

export const pages = new Hono<AppEnv>();

pages.get('/', async (c) => {
  const [s, latest] = await Promise.all([getSettings(c), findLatestWeekly(c.env.DB)]);
  const hero = (
    <section class="hero" style={`background-image: url("${encodeURI(s.heroImageUrl)}")`}>
      <div class="container">
        <span class="hero-eyebrow">台灣基督長老教會 · 高雄中會</span>
        <h1>{s.siteName}</h1>
        <p>位在梓官蚵仔寮的小漁村教會。歡迎你來一起敬拜，認識耶穌的愛。</p>
        <div class="hero-actions">
          <a class="btn btn-gold btn-lg" href="/contact">
            <i class="bi bi-geo-alt me-1"></i>聚會時間與交通
          </a>
          <a class="btn btn-light-on-dark btn-lg" href="/weeklies">
            <i class="bi bi-journal-text me-1"></i>本週週報
          </a>
        </div>
      </div>
    </section>
  );
  const date = latest ? taipeiDateParts(latest.publishedAt) : null;

  return c.html(
    <Page settings={s} view={viewState(c)} heading={s.siteName} hero={hero}>
      <div class="container">
        <section class="section">
          <h2 class="section-title">聚會時間</h2>
          <div class="row g-3">
            <div class="col-12 col-md-4">
              <div class="tile">
                <div class="tile-icon">
                  <i class="bi bi-brightness-high"></i>
                </div>
                <h3>主日崇拜</h3>
                <p class="muted">{s.sundayService}</p>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="tile">
                <div class="tile-icon">
                  <i class="bi bi-moon-stars"></i>
                </div>
                <h3>青少年團契</h3>
                <p class="muted">{s.youthFellowship}</p>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="tile">
                <div class="tile-icon gold">
                  <i class="bi bi-telephone"></i>
                </div>
                <h3>教會辦公室</h3>
                <p class="muted mb-1">{s.officeHours}</p>
                <p>
                  <a href={`tel:${s.phone}`}>{s.phone}</a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">最新週報</h2>
          {latest && date ? (
            <div class="tile feature">
              <div class="date-badge" aria-hidden="true">
                <span class="m">{date.month} 月</span>
                <span class="d">{date.day}</span>
                <span class="y">{date.year}</span>
              </div>
              <div>
                <h3 class="mb-1">{latest.title}</h3>
                <p class="muted mb-3">
                  第 {latest.issue} 期 · {formatDate(latest.publishedAt)}
                </p>
                <div class="d-flex flex-wrap gap-2">
                  <a class="btn btn-primary" href={`/weeklies/${latest.id}`}>
                    <i class="bi bi-book me-1"></i>線上閱讀
                  </a>
                  <a class="btn btn-outline-primary" href="/weeklies">
                    所有週報
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div class="empty-state">
              <i class="bi bi-journal"></i>
              週報即將上線
            </div>
          )}
        </section>

        <section class="section">
          <div class="row g-4 align-items-stretch">
            <div class="col-12 col-lg-7">
              <h2 class="section-title">歡迎來到茄典</h2>
              <p class="prose">
                茄典教會位於高雄一個名叫蚵仔寮的小漁村。這裡沒有都市的繁華，但在這裡信仰耶穌基督的人們，內心卻富有無比。無論你是第一次來，或是回到家鄉，我們都誠摯歡迎你。
              </p>
              <div class="d-flex flex-wrap gap-2">
                <a class="btn btn-outline-primary" href="/about">
                  認識我們
                </a>
                <a class="btn btn-outline-primary" href="/tithing">
                  奉獻方式
                </a>
              </div>
            </div>
            <div class="col-12 col-lg-5">
              <div class="tile">
                <h3>跟我們保持聯繫</h3>
                <p class="muted">追蹤教會的社群，收到最新的聚會與活動消息。</p>
                <div class="d-grid gap-2">
                  {s.facebookUrl && (
                    <a class="btn btn-outline-primary" href={s.facebookUrl}>
                      <i class="bi bi-facebook me-1"></i>Facebook 粉絲專頁
                    </a>
                  )}
                  {s.youtubeUrl && (
                    <a class="btn btn-outline-primary" href={s.youtubeUrl}>
                      <i class="bi bi-youtube me-1"></i>YouTube 頻道
                    </a>
                  )}
                  {s.lineUrl && (
                    <a class="btn btn-outline-primary" href={s.lineUrl}>
                      <i class="bi bi-line me-1"></i>LINE 官方帳號
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Page>,
  );
});

// The Rails site also served the home page at /index
pages.get('/index', (c) => c.redirect('/', 301));

pages.get('/about', async (c) => {
  const s = await getSettings(c);
  const paragraphs = [
    '茄典教會位於一個在高雄名叫蚵仔寮的小漁村，這裡沒有都市的繁華，沒有太多高級物質的生活，但在這裡信仰耶穌基督的人們內心卻富有無比。',
    '而我們茄典教會青少年團契是一群在愛裡生長的青少年，我們彼此激勵、彼此扶持、彼此協助、相互成長，改正自己的缺點，尊行耶穌的道。我們是一群願意接受耶穌的愛的孩子，因此我們活得很富有；我們活得很快樂。',
    '我們希望將這份感動與美麗的經驗與你們分享。',
    '如果你願意加入我們、支持我們，或是一起參與在我們當中，我們誠摯歡迎你，你的生命可以不一樣！',
  ];
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="關於我們"
      description={paragraphs.join('\n')}
      active="about"
      breadcrumb={[{ label: '關於我們', href: '/about' }]}
      heading="關於我們"
      lead="像耶穌一樣愛人"
    >
      <div class="container">
        <div class="row g-4">
          <div class="col-12 col-lg-8 prose">
            {paragraphs.map((text) => (
              <p>{text}</p>
            ))}
          </div>
          <div class="col-12 col-lg-4">
            <div class="tile">
              <h3>第一次來嗎？</h3>
              <p class="muted">主日崇拜 {s.sundayService}，歡迎直接到教會，不需要事先報名。</p>
              <a class="btn btn-primary" href="/contact">
                交通與聯絡方式
              </a>
            </div>
          </div>
        </div>
      </div>
    </Page>,
  );
});

pages.get('/contact', async (c) => {
  const s = await getSettings(c);
  const description = '歡迎來教會，也歡迎透過以下方式聯絡我們。';
  const meetings: [string, string][] = [
    ['主日崇拜', s.sundayService],
    ['青少年團契', s.youthFellowship],
    ['辦公時間', s.officeHours],
  ];
  // A social link left empty in the settings is not shown
  const contacts = (
    [
    ['電話', s.phone, `tel:${s.phone}`],
    ['傳真', s.fax],
    ['Email', s.email, `mailto:${s.email}`],
    ['統一編號', s.taxId],
    ['Facebook', '粉絲專頁', s.facebookUrl],
    ['YouTube', '頻道', s.youtubeUrl],
    ['LINE', '官方帳號', s.lineUrl],
    ] as [string, string, string?][]
  ).filter(([, , href]) => href !== '');
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="聚會與交通"
      description={description}
      active="contact"
      breadcrumb={[{ label: '聚會與交通', href: '/contact' }]}
      heading="聚會與交通"
      lead={description}
    >
      <div class="container">
        <div class="row g-4">
          <div class="col-12 col-lg-5">
            <div class="tile mb-4">
              <div class="tile-icon">
                <i class="bi bi-calendar3"></i>
              </div>
              <h3>聚會時間</h3>
              <ul class="info-list">
                {meetings.map(([label, value]) => (
                  <li>
                    <span class="label">{label}</span>
                    <span class="value">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div class="tile">
              <div class="tile-icon gold">
                <i class="bi bi-envelope"></i>
              </div>
              <h3>{s.siteName}</h3>
              <address class="muted mb-2">{s.address}</address>
              <ul class="info-list">
                {contacts.map(([label, value, href]) => (
                  <li>
                    <span class="label">{label}</span>
                    <span class="value">{href ? <a href={href}>{value}</a> : value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div class="col-12 col-lg-7">
            <iframe
              class="map-frame"
              src={s.mapEmbedUrl}
              title="教會位置地圖"
              loading="lazy"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>
    </Page>,
  );
});

pages.get('/tithing', async (c) => {
  const s = await getSettings(c);
  const description = '在外工作或讀書的弟兄姊妹，也可以透過匯款奉獻給教會。';
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="奉獻方式"
      description={description}
      active="tithing"
      breadcrumb={[{ label: '奉獻方式', href: '/tithing' }]}
      heading="奉獻方式"
      lead={description}
    >
      <div class="container">
        <div class="row g-4">
          <div class="col-12 col-lg-6">
            <div class="account-card">
              <div class="label">金融機構</div>
              <div class="mb-3">
                {s.tithingBank}（代碼 {s.tithingBankCode}）
              </div>
              <div class="label">帳號</div>
              <div class="number mb-3">{s.tithingAccount}</div>
              <div class="label">戶名</div>
              <div>{s.legalName}</div>
            </div>
          </div>
          <div class="col-12 col-lg-6 prose">
            <h2 class="h4">怎麼奉獻</h2>
            <ul>
              <li>ATM 轉帳</li>
              <li>網路銀行或手機轉帳，備註寫上奉獻人姓名與奉獻用途</li>
              <li>到銀行、郵局或農漁會臨櫃匯款，匯款單寫上奉獻人姓名與奉獻用途</li>
            </ul>
            <h2 class="h4">奉獻之後</h2>
            <p>請把你的帳號後 5 碼和奉獻項目告訴教會，讓我們能正確入帳：</p>
            <ol class="steps">
              <li>通知茄典教會財務部出納</li>
              <li>
                或撥打教會電話 <a href={`tel:${s.phone}`}>{s.phone}</a> 通知教會幹事
              </li>
            </ol>
          </div>
        </div>
      </div>
    </Page>,
  );
});

pages.get('/term', async (c) => {
  const s = await getSettings(c);
  const description = '請閱讀以下條款，了解本網站將如何保護與運用使用者提供的資料。';
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="隱私條款"
      description={description}
      breadcrumb={[{ label: '隱私條款', href: '/term' }]}
      heading="隱私條款"
      lead={description}
    >
      <div class="container prose">
        <h2>個人資料提供告知暨同意書</h2>
        <p>
          台灣基督長老教會高雄中會茄典教會(下稱本會)為推動相關業務及提供相關服務所需，依個人資料保護法之相關規定，將對您個人資料進行蒐集、處理或利用，依法告知您以下事項，為保障您的權益，請詳細閱讀本同意書所有內容。當您簽署本同意書時，表示您已閱讀、瞭解並同意接受本同意書之所有內容及其後修改變更規定。若您未滿二十歲，應於您的法定代理人閱讀、瞭解並同意本同意書之所有內容及其後修改變更規定，但若您簽署本同意書時，視為您已取得法定代理人之同意，並遵守以下所有規範。
        </p>
        <ol>
          <li>本會為進行蒐集、處理或利用您個人資料之機構。</li>
          <li>
            蒐集之目的：包括但不限於：○一○ 公立與私立慈善機構管理、○四三 志工管理、○四九
            宗教、非營利組織業務、○六九 契約、類似契約或其他法律關係事務、一○九
            教育或訓練行政、一三○ 會議管理、一七六
            其他自然人基於正當性目的所進行個人資料之蒐集處理及利用。
          </li>
          <li>
            個人資料之類別。包括但不限於：Ｃ○○一 辨識個人者、Ｃ○二一 家庭情形、Ｃ○二三
            家庭其他成員之細節、Ｃ一二○ 宗教信仰。請提供您本人正確、最新及完整的個人資料。
          </li>
          <li>
            個人資料利用之期間、地區、對象及方式。
            <ol>
              <li>
                個人資料利用期間：自蒐集之日到生命終止之日止，但依法令或法定職務得利用者，不在此限。
              </li>
              <li>個人資料利用地區：我國境內（包括臺澎金馬地區）。</li>
              <li>
                個人資料利用對象及方式：資料利用對象為本會及本會簽訂委外合約之委外廠商、單位及個人。其方式包括但不限於製作會員籍資料、通訊錄、週報、會員和會手冊、選舉、捐款徵信、來賓介紹、教會活動報名與辦理保險及依臺灣基督長老教會教會法規辦理事項等。
              </li>
            </ol>
          </li>
          <li>
            您可依個人資料保護法第三條規定以書面向本會要求行使以下之權利，若您的個人資料有任何異動，請主動向本會申請更正，使其保持正確、最新及完整。
            <ol>
              <li>查詢或請求閱覽您的個人資料。</li>
              <li>請求製給您的個人資料複製本。</li>
              <li>請求補充或更正您的個人資料。</li>
              <li>請求停止蒐集、處理或利用您的個人資料。</li>
              <li>請求刪除您的個人資料。</li>
            </ol>
            但因本會執行職務或業務所必須者，本會得拒絕之。若您欲執行上述權利時，請參考本會之個人資料保護聯絡窗口聯絡方式與本機關連繫。
          </li>
          <li>
            您得自由選擇是否提供本會個人資料，惟不提供將影響本會對您的服務或台端之權益。若您提供錯誤、不實、過時或不完整或具誤導性的資料，本會保留隨時終止您接受使用相關服務資格的權利。
          </li>
          <li>
            您瞭解此一同意書符合個人資料保護法及相關法規之要求，具有書面同意本會蒐集、處理及使用您的個人資料之效果，且同意本會留存此同意書，供日後取出查驗。如您如違反本同意書相關條款時，本會得隨時終止對您提供之一切服務。
          </li>
          <li>
            本會保留隨時修改本同意書規範之權利，本會將於修改規範時，將於本會網頁公告修改之事實，不另作個別通知。如果您不同意修改的內容，請主動通知本會。否則將視為您已同意並接受本規範該等增訂或修改內容之拘束。
          </li>
          <li>
            本同意書之解釋與適用，以及與本同意書有關的爭議，均先經雙方協議，協議不成，依照我國境內法律予以處理，並以本會所在地之地方法院為第一審管轄法院。
          </li>
        </ol>
      </div>
    </Page>,
  );
});
