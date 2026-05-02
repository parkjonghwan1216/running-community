'use client';
import { useState } from 'react';
import { toast } from 'sonner';

interface Shoe {
  id: number;
  brand: string;
  model: string;
  color: string | null;
  bought_at: string | null;
  km_initial: number;
  km_total: number;
  retired: number;
}

function kmStatus(km: number): 'good' | 'warn' | 'over' {
  if (km >= 600) return 'over';
  if (km >= 400) return 'warn';
  return 'good';
}

const KM_LABEL = { good: '양호', warn: '교체 검토', over: '교체 권장' };
const KM_COLOR = { good: '#1a7f4f', warn: '#d97706', over: '#d12f2f' };

export default function ShoesClient({ initial }: { initial: Shoe[] }) {
  const [shoes, setShoes] = useState<Shoe[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [addingRun, setAddingRun] = useState<number | null>(null);
  const [form, setForm] = useState({ brand: '', model: '', color: '', boughtAt: '', kmInitial: '' });
  const [runForm, setRunForm] = useState({ km: '', runDate: new Date().toISOString().slice(0, 10), note: '' });

  async function onAddShoe(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/shoes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        brand: form.brand.trim(),
        model: form.model.trim(),
        color: form.color.trim() || undefined,
        boughtAt: form.boughtAt || undefined,
        kmInitial: form.kmInitial ? parseFloat(form.kmInitial) : undefined,
      }),
    });
    if (!res.ok) { toast.error('등록 실패'); return; }
    const shoe: Shoe = await res.json();
    setShoes((s) => [shoe, ...s]);
    setShowAdd(false);
    setForm({ brand: '', model: '', color: '', boughtAt: '', kmInitial: '' });
    toast.success('러닝화가 등록되었습니다');
  }

  async function onRetire(id: number) {
    if (!confirm('이 러닝화를 은퇴 처리할까요?')) return;
    const res = await fetch(`/api/shoes/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'retire' }),
    });
    if (!res.ok) { toast.error('실패'); return; }
    setShoes((s) => s.map((sh) => sh.id === id ? { ...sh, retired: 1 } : sh));
    toast.success('은퇴 처리되었습니다');
  }

  async function onDelete(id: number) {
    if (!confirm('삭제할까요?')) return;
    const res = await fetch(`/api/shoes/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('실패'); return; }
    setShoes((s) => s.filter((sh) => sh.id !== id));
    toast.success('삭제되었습니다');
  }

  async function onAddRun(e: React.FormEvent, shoeId: number) {
    e.preventDefault();
    const res = await fetch(`/api/shoes/${shoeId}/runs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ km: parseFloat(runForm.km), runDate: runForm.runDate, note: runForm.note || undefined }),
    });
    if (!res.ok) { toast.error('기록 실패'); return; }
    const km = parseFloat(runForm.km);
    setShoes((s) =>
      s.map((sh) => sh.id === shoeId ? { ...sh, km_total: Math.round((sh.km_total + km) * 10) / 10 } : sh),
    );
    setAddingRun(null);
    setRunForm({ km: '', runDate: new Date().toISOString().slice(0, 10), note: '' });
    toast.success(`${km}km 기록 완료`);
  }

  const active = shoes.filter((s) => !s.retired);
  const retired = shoes.filter((s) => s.retired);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>러닝화 보유함</h2>
        <button className="btn btn--primary" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? '취소' : '+ 러닝화 추가'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={onAddShoe} className="card stack" style={{ marginBottom: 20, gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field__label">브랜드 *</label>
              <input className="input" placeholder="Nike" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field__label">모델 *</label>
              <input className="input" placeholder="Pegasus 41" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field__label">색상</label>
              <input className="input" placeholder="블랙/화이트" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field__label">구입일</label>
              <input className="input" type="date" value={form.boughtAt} onChange={(e) => setForm({ ...form, boughtAt: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field__label">기존 누적 km</label>
              <input className="input" type="number" placeholder="0" min="0" step="0.1" value={form.kmInitial} onChange={(e) => setForm({ ...form, kmInitial: e.target.value })} />
            </div>
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">등록</button>
          </div>
        </form>
      )}

      {active.length === 0 && !showAdd && (
        <div className="card empty-state"><p>아직 등록된 러닝화가 없습니다.</p></div>
      )}

      <div className="shoe-list">
        {active.map((shoe) => {
          const status = kmStatus(shoe.km_total);
          const pct = Math.min(100, (shoe.km_total / 600) * 100);
          return (
            <div key={shoe.id} className="shoe-card card">
              <div className="shoe-card__head">
                <div>
                  <div className="shoe-card__name">{shoe.brand} <strong>{shoe.model}</strong></div>
                  {shoe.color && <div className="muted" style={{ fontSize: 13 }}>{shoe.color}</div>}
                </div>
                <span className="shoe-badge" style={{ color: KM_COLOR[status] }}>
                  {KM_LABEL[status]}
                </span>
              </div>

              <div className="shoe-km">
                <div className="shoe-km__bar">
                  <div
                    className="shoe-km__fill"
                    style={{ width: `${pct}%`, background: KM_COLOR[status] }}
                  />
                </div>
                <div className="shoe-km__text">
                  <strong>{shoe.km_total} km</strong>
                  <span className="muted">/ 600 km 권장 교체</span>
                </div>
              </div>

              {addingRun === shoe.id ? (
                <form onSubmit={(e) => onAddRun(e, shoe.id)} style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input className="input" type="number" placeholder="km" min="0.1" step="0.1" required style={{ width: 90 }}
                    value={runForm.km} onChange={(e) => setRunForm({ ...runForm, km: e.target.value })} />
                  <input className="input" type="date" required style={{ width: 140 }}
                    value={runForm.runDate} onChange={(e) => setRunForm({ ...runForm, runDate: e.target.value })} />
                  <input className="input" placeholder="메모" style={{ flex: 1, minWidth: 100 }}
                    value={runForm.note} onChange={(e) => setRunForm({ ...runForm, note: e.target.value })} />
                  <button type="submit" className="btn btn--primary">기록</button>
                  <button type="button" className="btn btn--ghost" onClick={() => setAddingRun(null)}>취소</button>
                </form>
              ) : (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn--ghost" style={{ fontSize: 13 }} onClick={() => setAddingRun(shoe.id)}>
                    + 달린 거리 기록
                  </button>
                  <button className="btn btn--ghost" style={{ fontSize: 13 }} onClick={() => onRetire(shoe.id)}>
                    은퇴
                  </button>
                  <button className="link-btn" style={{ fontSize: 13, color: 'var(--danger)', marginLeft: 4 }} onClick={() => onDelete(shoe.id)}>
                    삭제
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {retired.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary className="muted" style={{ cursor: 'pointer', fontSize: 14, marginBottom: 12 }}>
            은퇴한 러닝화 ({retired.length})
          </summary>
          <div className="shoe-list">
            {retired.map((shoe) => (
              <div key={shoe.id} className="shoe-card card" style={{ opacity: 0.6 }}>
                <div className="shoe-card__head">
                  <div>
                    <div className="shoe-card__name">{shoe.brand} <strong>{shoe.model}</strong></div>
                    <div className="muted" style={{ fontSize: 13 }}>총 {shoe.km_total} km</div>
                  </div>
                  <span className="shoe-badge" style={{ color: 'var(--text-muted)' }}>은퇴</span>
                </div>
                <button className="link-btn" style={{ fontSize: 13, color: 'var(--danger)', marginTop: 8 }} onClick={() => onDelete(shoe.id)}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
