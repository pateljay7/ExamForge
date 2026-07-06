import { useEffect, useState } from 'react';
import { api } from '../api';

type CatalogEntry = { module: string; label: string; actions: string[] };
type Perms = Record<string, Record<string, boolean>>;
type Role = {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: Perms;
  _count: { users: number };
};

function emptyPerms(catalog: CatalogEntry[]): Perms {
  const p: Perms = {};
  for (const m of catalog) {
    p[m.module] = {};
    for (const a of m.actions) p[m.module][a] = false;
  }
  return p;
}

export default function Roles() {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null); // null = closed
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [perms, setPerms] = useState<Perms>({});
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([api.permissionCatalog(), api.listRoles()])
      .then(([cat, r]) => {
        setCatalog(cat);
        setRoles(r);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setIsNew(true);
    setEditingId('new');
    setName('');
    setPerms(emptyPerms(catalog));
    setError('');
  }
  function openEdit(role: Role) {
    setIsNew(false);
    setEditingId(role.id);
    setName(role.name);
    // Merge stored perms onto full catalog so new modules show up.
    const base = emptyPerms(catalog);
    for (const m of catalog)
      for (const a of m.actions)
        base[m.module][a] = !!role.permissions?.[m.module]?.[a];
    setPerms(base);
    setError('');
  }
  function close() {
    setEditingId(null);
  }

  function toggle(module: string, action: string) {
    setPerms((p) => ({
      ...p,
      [module]: { ...p[module], [action]: !p[module][action] },
    }));
  }
  function toggleModule(m: CatalogEntry, value: boolean) {
    setPerms((p) => ({
      ...p,
      [m.module]: Object.fromEntries(m.actions.map((a) => [a, value])),
    }));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      if (isNew) await api.createRole({ name, permissions: perms });
      else await api.updateRole(editingId!, { name, permissions: perms });
      close();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(role: Role) {
    if (
      !confirm(
        `Delete role "${role.name}"?${
          role._count.users
            ? ` Its ${role._count.users} member(s) will move to the User role.`
            : ''
        }`,
      )
    )
      return;
    try {
      await api.deleteRole(role.id);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Roles &amp; permissions</h1>
          <p>Control what each role can do across the platform.</p>
        </div>
        <button className="btn btn-lg" onClick={openNew}>＋ New role</button>
      </div>

      {error && <p className="error">{error}</p>}

      {editingId && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h2>{isNew ? 'Create role' : 'Edit role'}</h2>
          <label>Role name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Instructor" />

          <label>Permissions</label>
          <div className="perm-table">
            <div className="perm-row perm-head">
              <span>Module</span>
              <span className="perm-actions">Actions</span>
            </div>
            {catalog.map((m) => {
              const all = m.actions.every((a) => perms[m.module]?.[a]);
              return (
                <div className="perm-row" key={m.module}>
                  <span className="perm-mod">
                    {m.label}
                    <button
                      type="button"
                      className="perm-all"
                      onClick={() => toggleModule(m, !all)}
                    >
                      {all ? 'clear' : 'all'}
                    </button>
                  </span>
                  <span className="perm-actions">
                    {m.actions.map((a) => (
                      <label className="perm-check" key={a}>
                        <input
                          type="checkbox"
                          checked={!!perms[m.module]?.[a]}
                          onChange={() => toggle(m.module, a)}
                        />
                        {a}
                      </label>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} disabled={saving || !name.trim()}>
              {saving ? <span className="spinner" /> : isNew ? 'Create role' : 'Save changes'}
            </button>
            <button className="btn-ghost" onClick={close}>Cancel</button>
          </div>
        </div>
      )}

      {roles.map((role) => (
        <div className="card" key={role.id}>
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2>{role.name}</h2>
              {role.isSystem && <span className="badge shared">Predefined</span>}
              <span className="muted">{role._count.users} member{role._count.users === 1 ? '' : 's'}</span>
            </div>
            {!role.isSystem && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost btn-sm" onClick={() => openEdit(role)}>Edit</button>
                <button className="btn-ghost btn-sm" onClick={() => remove(role)}>Delete</button>
              </div>
            )}
          </div>
          <div className="perm-summary">
            {catalog.map((m) => {
              const granted = m.actions.filter((a) => role.permissions?.[m.module]?.[a]);
              return (
                <span className="tag-chip" key={m.module} title={granted.join(', ') || 'no access'}>
                  {m.label}: {granted.length ? granted.join('/') : '—'}
                </span>
              );
            })}
          </div>
          {role.isSystem && (
            <p className="hint" style={{ marginTop: 10 }}>
              Predefined roles can't be edited or deleted.
            </p>
          )}
        </div>
      ))}
    </>
  );
}
