import { Hono } from 'hono';
import { getSettings, type AppEnv } from '../app';
import { countWeeklyView, findLatestWeekly, findWeekly, listWeeklies } from '../data/weeklies';
import { formatDateTime, parseId, parsePage } from '../format';
import { Page, Pagination } from '../views/layout';

export const weeklies = new Hono<AppEnv>();

const crumb = { label: '週報', href: '/weeklies' };

weeklies.get('/', async (c) => {
  const page = parsePage(c.req.query('page'));
  const [s, list] = await Promise.all([getSettings(c), listWeeklies(c.env.DB, page)]);
  const description = '可以來這裡查看每週教會的大小消息';
  const pagination = <Pagination page={page} totalPages={list.totalPages} path="/weeklies" />;
  return c.html(
    <Page
      settings={s}
      title="週報"
      description={description}
      active="weeklies"
      breadcrumb={[crumb]}
      heading="週報"
      lead={<p class="lead">{description}</p>}
    >
      <div class="container">
        {pagination}
        <div class="table-responsive">
          <table class="table">
            <thead class="table-light">
              <tr>
                <th>標題</th>
                <th>刊號</th>
                <th>瀏覽次數</th>
                <th>發布時間</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((weekly) => (
                <tr>
                  <td>
                    <a class="text-decoration-none" href={`/weeklies/${weekly.id}`}>
                      {weekly.title}
                    </a>
                  </td>
                  <td>{weekly.issue}</td>
                  <td>{weekly.viewedCount}</td>
                  <td>{formatDateTime(weekly.publishedAt)}</td>
                  <td>
                    {weekly.pdfKey && (
                      <a
                        class="btn btn-sm btn-outline-secondary"
                        href={`/weeklies/${weekly.id}.pdf`}
                      >
                        <i class="bi bi-file-earmark-pdf me-1"></i>查看
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination}
      </div>
    </Page>,
  );
});

// /weeklies/latest and /weeklies/latest.pdf always point at the newest published weekly
weeklies.get('/:latest{latest(?:\\.pdf)?}', async (c) => {
  const weekly = await findLatestWeekly(c.env.DB);
  if (!weekly) return c.notFound();
  const suffix = c.req.param('latest').endsWith('.pdf') ? '.pdf' : '';
  return c.redirect(`/weeklies/${weekly.id}${suffix}`);
});

weeklies.get('/:file', async (c) => {
  const file = c.req.param('file');
  const wantsPdf = file.endsWith('.pdf');
  const id = parseId(wantsPdf ? file.slice(0, -'.pdf'.length) : file);
  const weekly = id === null ? undefined : await findWeekly(c.env.DB, id);
  if (!weekly) return c.notFound();

  if (wantsPdf) {
    const object = weekly.pdfKey ? await c.env.FILES.get(weekly.pdfKey) : null;
    // Same as the Rails site: a weekly without a PDF sends the reader back to its page
    if (!object) return c.redirect(`/weeklies/${weekly.id}`);
    await countWeeklyView(c.env.DB, weekly.id);
    const filename = encodeURIComponent(weekly.pdfFilename ?? `${weekly.id}.pdf`);
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename*=UTF-8''${filename}`,
        'Content-Length': String(object.size),
        ETag: object.httpEtag,
        'Cache-Control': 'private, no-cache',
      },
    });
  }

  const s = await getSettings(c);
  await countWeeklyView(c.env.DB, weekly.id);
  const title = `週報 ${weekly.title}`;
  return c.html(
    <Page
      settings={s}
      title={title}
      active="weeklies"
      breadcrumb={[crumb, { label: weekly.title, href: `/weeklies/${weekly.id}` }]}
      heading="週報"
      lead={<p class="lead">{weekly.title}</p>}
    >
      <div class="container">
        <a class="btn btn-outline-secondary mb-4" href="/weeklies">
          <i class="bi bi-list me-1"></i>週報一覽
        </a>
        <dl class="row">
          <dt class="col-4 col-md-2">標題</dt>
          <dd class="col-8 col-md-10">{weekly.title}</dd>
          <dt class="col-4 col-md-2">刊號</dt>
          <dd class="col-8 col-md-10">{weekly.issue}</dd>
          <dt class="col-4 col-md-2">瀏覽次數</dt>
          <dd class="col-8 col-md-10">{weekly.viewedCount + 1}</dd>
          <dt class="col-4 col-md-2">發布時間</dt>
          <dd class="col-8 col-md-10">{formatDateTime(weekly.publishedAt)}</dd>
        </dl>
        {weekly.pdfKey ? (
          <>
            <p>
              <a href={`/weeklies/${weekly.id}.pdf`}>{weekly.pdfFilename ?? 'PDF'}</a>
            </p>
            <iframe class="pdf-frame" src={`/weeklies/${weekly.id}.pdf`} title={title}></iframe>
          </>
        ) : (
          <p class="text-muted">沒有上傳 PDF 附件</p>
        )}
      </div>
    </Page>,
  );
});
