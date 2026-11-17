import { Hono } from 'hono';
import { getSettings, viewState, type AppEnv } from '../app';
import { Page } from '../views/layout';

export const pages = new Hono<AppEnv>();

pages.get('/', async (c) => {
  const s = await getSettings(c);
  const card = 'card outline-purple text-center h-100';
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      heading={s.siteName}
      lead={
        <>
          <p class="lead mt-4">站內有本教會相關之教會活動與與最新消息</p>
          <p class="lead">歡迎會友透過此網站查看教會最新消息以及報名參加活動</p>
        </>
      }
    >
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <div class="col">
          <div class={card}>
            <div class="card-body">
              <h2 class="card-title">教會資訊</h2>
              <p class="card-text">點此前往查看最新的教會消息</p>
            </div>
            <div class="card-body d-grid gap-2">
              <a class="btn btn-light" href="/weeklies">
                週報
              </a>
              <a class="btn btn-light" href="/groups">
                小組
              </a>
              <a class="btn btn-light" href="/tithing">
                奉獻方式
              </a>
            </div>
          </div>
        </div>
        <div class="col">
          <div class={card}>
            <div class="card-body">
              <h2 class="card-title">網路社群</h2>
              <p class="card-text">歡迎追蹤或加入我們的網路社群</p>
            </div>
            <div class="list-group list-group-flush">
              <a class="btn btn-light list-group-item" href={s.facebookUrl}>
                Facebook 粉絲專頁
              </a>
              <a class="btn btn-light list-group-item" href={s.youtubeUrl}>
                YouTube 頻道
              </a>
              <a class="btn btn-light list-group-item" href={s.lineUrl}>
                Line @
              </a>
            </div>
          </div>
        </div>
        <div class="col">
          <div class={card}>
            <div class="card-body">
              <h2 class="card-title">活動專區</h2>
              <p class="card-text">點此前往查看教會活動</p>
            </div>
            <div class="card-body d-grid">
              <a class="btn btn-purple" href="/events">
                活動列表
              </a>
            </div>
          </div>
        </div>
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
    '如果你願意加入我們、支持我們，或是一起參與在我們當中，我們誠摯歡迎你，你的生命可以不一樣！。',
  ];
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="關於茄典"
      description={paragraphs.join('\n')}
      breadcrumb={[{ label: '關於茄典', href: '/about' }]}
      heading="關於茄典"
      lead={<p class="lead">像耶穌一樣愛人</p>}
    >
      <div class="container">
        {paragraphs.map((text) => (
          <p>{text}</p>
        ))}
      </div>
    </Page>,
  );
});

pages.get('/contact', async (c) => {
  const s = await getSettings(c);
  const origin = new URL(c.req.url).origin;
  const description = '歡迎透過以下方式聯絡我們。';
  const rows: [string, string, string?][] = [
    ['主日崇拜', s.sundayService],
    ['青少年團契', s.youthFellowship],
    ['電話', s.phone, `tel:${s.phone}`],
    ['傳真', s.fax],
    ['統一編號', s.taxId],
    ['Email', s.email, `mailto:${s.email}`],
    ['網站', origin, '/'],
    ['Facebook', s.facebookUrl, s.facebookUrl],
    ['YouTube', s.youtubeUrl, s.youtubeUrl],
    ['Line @', s.lineUrl, s.lineUrl],
  ];
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="聯絡我們"
      description={description}
      breadcrumb={[{ label: '聯絡我們', href: '/contact' }]}
      heading="聯絡我們"
      lead={<p class="lead">{description}</p>}
    >
      <div class="container">
        <div class="row">
          <div class="col-lg-6 col-md-12 my-2">
            <h2>{s.siteName}</h2>
            <address>{s.address}</address>
            <dl class="row">
              {rows.map(([label, value, href]) => (
                <>
                  <dt class="col-4">{label}</dt>
                  <dd class="col-8 text-break">{href ? <a href={href}>{value}</a> : value}</dd>
                </>
              ))}
            </dl>
          </div>
          <div class="col-md-12 col-lg-6 my-2">
            <iframe
              src={s.mapEmbedUrl}
              title="教會位置地圖"
              width="100%"
              height="100%"
              style="min-height: 500px; border: 0"
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
  const description =
    '弟兄姊妹平安，在外工作或讀書的你可以透過線上奉獻囉，本頁將指引你如何透過匯款線上奉獻給教會';
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="奉獻方式"
      description={description}
      breadcrumb={[{ label: '奉獻方式', href: '/tithing' }]}
      heading="奉獻方式"
      lead={<p class="lead">{description}</p>}
    >
      <div class="container">
        <h3>匯款奉獻的方式有哪些呢?</h3>
        <ul>
          <li>可以使用 ATM 轉帳</li>
          <li>可以使用網路銀行或手機轉帳，在備註寫上奉獻人姓名 + 奉獻用途</li>
          <li>可以到銀行，郵局或農漁會臨櫃匯款，在匯款單寫奉獻人姓名 + 奉獻用途</li>
        </ul>
        <hr />
        <h3>茄典教會的帳號是什麼呢?</h3>
        <ul>
          <li>農會：{s.tithingBank}</li>
          <li>銀行代碼：{s.tithingBankCode}</li>
          <li>帳戶：{s.tithingAccount}</li>
          <li>戶名：{s.legalName}</li>
        </ul>
        <hr />
        <h3>奉獻後需要做什麼呢?</h3>
        <p class="text-purple">
          <strong>線上奉獻後，請提供您的帳號後 5 碼和奉獻項目</strong>
        </p>
        <ul>
          <li>通知茄典教會財務部出納</li>
          <li>撥打教會電話：{s.phone} 通知教會幹事</li>
        </ul>
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
      lead={<p class="lead">{description}</p>}
    >
      <div class="container">
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
