export default function Loading() {
  return (
    <>
      <div className="section-head">
        <div>
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--line" style={{ width: 220 }} />
        </div>
      </div>
      <ul className="post-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="post-list__item">
            <div className="skeleton skeleton--line" style={{ width: '60%' }} />
            <div className="skeleton skeleton--line" style={{ width: '90%', marginTop: 8 }} />
            <div className="skeleton skeleton--line" style={{ width: '40%', marginTop: 8 }} />
          </li>
        ))}
      </ul>
    </>
  );
}
