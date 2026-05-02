export default function Loading() {
  return (
    <article className="article">
      <div className="skeleton skeleton--chip" style={{ marginBottom: 12 }} />
      <div className="skeleton skeleton--title" style={{ width: '80%' }} />
      <div className="skeleton skeleton--line" style={{ width: 240, marginTop: 12, marginBottom: 24 }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton skeleton--line" style={{ width: i % 3 === 0 ? '70%' : '95%', marginTop: 10 }} />
      ))}
    </article>
  );
}
