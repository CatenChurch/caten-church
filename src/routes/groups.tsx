import { Hono } from 'hono';
import { getSettings, viewState, type AppEnv } from '../app';
import { findGroup, listGroups } from '../data/groups';
import { parseId } from '../format';
import { Page, SimpleFormat } from '../views/layout';

export const groups = new Hono<AppEnv>();

const crumb = { label: '小組', href: '/groups' };
const lead = <p class="lead">教會團契與小組</p>;

groups.get('/', async (c) => {
  const [s, list] = await Promise.all([getSettings(c), listGroups(c.env.DB)]);
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title="小組"
      active="groups"
      breadcrumb={[crumb]}
      heading="小組"
      lead={lead}
    >
      <div class="container">
        <div class="table-responsive">
          <table class="table">
            <thead class="table-light">
              <tr>
                <th>排序</th>
                <th>小組名稱</th>
                <th>組長</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((group) => (
                <tr>
                  <td>{group.sequence}</td>
                  <td>{group.name}</td>
                  <td>{group.leaderName}</td>
                  <td>
                    <a class="btn btn-sm btn-outline-secondary" href={`/groups/${group.id}`}>
                      <i class="bi bi-info-circle me-1"></i>查看
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>,
  );
});

groups.get('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const group = id === null ? undefined : await findGroup(c.env.DB, id);
  if (!group) return c.notFound();
  const s = await getSettings(c);
  return c.html(
    <Page
      settings={s}
      view={viewState(c)}
      title={group.name}
      description={group.introduction}
      active="groups"
      breadcrumb={[crumb, { label: group.name, href: `/groups/${group.id}` }]}
      heading="小組"
      lead={lead}
    >
      <div class="container">
        <a class="btn btn-outline-secondary mb-2" href="/groups">
          返回
        </a>
        <div class="card">
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between">
              <h5>小組名稱 :</h5>
              <span>{group.name}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <h5>組長 :</h5>
              <span>{group.leaderName}</span>
            </li>
            <li class="list-group-item">
              <h5>簡述 :</h5>
              <div class="card-body">
                <SimpleFormat text={group.introduction} />
              </div>
            </li>
            <li class="list-group-item">
              <h5>介紹 :</h5>
              <div class="card-body">
                <SimpleFormat text={group.description} />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Page>,
  );
});
