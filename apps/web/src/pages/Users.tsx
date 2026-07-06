import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

type Role = { id: string; name: string };
type Row = {
  id: string;
  email: string;
  name?: string;
  role: Role | null;
  _count: { exams: number; attempts: number };
};

export default function Users() {
  const { user, can } = useAuth();
  const [users, setUsers] = useState<Row[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = () =>
    Promise.all([api.listUsers(), api.listRoles()])
      .then(([u, r]) => {
        setUsers(u);
        setRoles(r.map((x: any) => ({ id: x.id, name: x.name })));
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function changeRole(row: Row, roleId: string) {
    setBusy(row.id);
    setError('');
    try {
      await api.assignRole(row.id, roleId);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function remove(row: Row) {
    if (!confirm(`Delete ${row.email}? This removes their exams and attempts.`)) return;
    setBusy(row.id);
    setError('');
    try {
      await api.deleteUser(row.id);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  const canEdit = can('users:edit');
  const canDelete = can('users:delete');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Assign roles and manage accounts.</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Exams</th>
              <th>Attempts</th>
              {canDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="u-name">{row.name || '—'}</div>
                  <div className="muted">
                    {row.email}
                    {row.id === user?.id && <span className="tag-chip" style={{ marginLeft: 8 }}>you</span>}
                  </div>
                </td>
                <td>
                  {canEdit ? (
                    <select
                      value={row.role?.id || ''}
                      disabled={busy === row.id}
                      onChange={(e) => changeRole(row, e.target.value)}
                    >
                      {!row.role && <option value="">— none —</option>}
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="tag-chip">{row.role?.name || '—'}</span>
                  )}
                </td>
                <td>{row._count.exams}</td>
                <td>{row._count.attempts}</td>
                {canDelete && (
                  <td>
                    {row.id !== user?.id && (
                      <button
                        className="btn-ghost btn-sm"
                        disabled={busy === row.id}
                        onClick={() => remove(row)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
