// Inline init script that runs before React hydration
// Reads stored preference (or system) and sets data-theme on <html>
// Prevents the dark/light flash on first paint.
const SCRIPT = `(()=>{try{
  const stored=localStorage.getItem('theme');
  const mq=window.matchMedia('(prefers-color-scheme: dark)');
  const apply=()=>{
    const v=localStorage.getItem('theme');
    const t=(v==='dark'||v==='light')?v:(mq.matches?'dark':'light');
    document.documentElement.setAttribute('data-theme',t);
  };
  apply();
  if(!stored) mq.addEventListener('change',apply);
}catch{}})();`;

export default function ThemeInit() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
