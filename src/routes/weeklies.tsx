import { Hono } from 'hono';
import { getSettings, viewState, type AppEnv } from '../app';
import { countWeeklyView, findLatestWeekly, findWeekly, listWeeklies } from '../data/weeklies';
import { formatDate, parseId, parsePage, taipeiDateParts } from '../format';
import { Page, Pagination } from '../views/layout';

export const weeklies = new Hono<AppEnv>();

const crumb = { label: '週報', href: '/weeklies' };

weeklies.get('/', async (c) => {
  const page = parsePage(c.req.query('page'));
  const [s, list] = await Promise.all([getSettings(c), listWeeklies(c.env.DB, page)]);
  const description = '每週主日的程序、報告與代禱事項';
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="週報"
      description={description}
      active="weeklies"
      breadcrumb={[crumb]}
      heading="週報"
      lead={description}
    >
      <div class="container" style="max-width: 860px">
        {list.rows.length === 0 ? (
          <div class="empty-state">
            <i class="bi bi-journal"></i>
            還沒有週報
          </div>
        ) : (
          <ul class="weekly-list">
            {list.rows.map((weekly) => {
              const date = taipeiDateParts(weekly.publishedAt);
              return (
                <li class="weekly-item">
                  <div class="date-badge" aria-hidden="true">
                    <span class="m">{date.month} 月</span>
                    <span class="d">{date.day}</span>
                    <span class="y">{date.year}</span>
                  </div>
                  <div class="body">
                    <a class="title" href={`/weeklies/${weekly.id}`}>
                      {weekly.title}
                    </a>
                    <div class="meta">
                      第 {weekly.issue} 期 · {formatDate(weekly.publishedAt)}
                    </div>
                  </div>
                  {weekly.pdfKey && (
                    <a
                      class="action btn btn-sm btn-outline-primary"
                      href={`/weeklies/${weekly.id}.pdf`}
                      aria-label={`${weekly.title} PDF`}
                    >
                      <i class="bi bi-file-earmark-pdf"></i>
                      <span class="d-none d-sm-inline ms-1">PDF</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} totalPages={list.totalPages} path="/weeklies" />
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
  const pdf = `/weeklies/${weekly.id}.pdf`;
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title={title}
      active="weeklies"
      breadcrumb={[crumb, { label: weekly.title, href: `/weeklies/${weekly.id}` }]}
      heading={weekly.title}
      lead={`第 ${weekly.issue} 期 · ${formatDate(weekly.publishedAt)}`}
    >
      <div class="container">
        <div class="d-flex flex-wrap gap-2 mb-3">
          <a class="btn btn-outline-primary" href="/weeklies">
            <i class="bi bi-arrow-left me-1"></i>所有週報
          </a>
          {weekly.pdfKey && (
            <a class="btn btn-primary" href={pdf} target="_blank" rel="noopener">
              <i class="bi bi-box-arrow-up-right me-1"></i>在新分頁開啟 PDF
            </a>
          )}
        </div>
        {weekly.pdfKey ? (
          <iframe class="pdf-frame" src={pdf} title={title}></iframe>
        ) : (
          <div class="empty-state">
            <i class="bi bi-file-earmark"></i>
            這期週報沒有上傳 PDF
          </div>
        )}
      </div>
    </Page>,
  );
});
