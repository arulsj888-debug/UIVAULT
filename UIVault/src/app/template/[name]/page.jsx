"use client";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function highlight(code, lang) {
  if (!code) return '';
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (lang === 'html' || lang === 'pug') {
    escaped = escaped.replace(/(&lt;\/?[\w\-]+)/g, '<span style="color:#a28efc">$1</span>');
    escaped = escaped.replace(/\s([\w\-:@]+)=/g, ' <span style="color:#ffa5d9">$1</span>=');
    escaped = escaped.replace(/="([^"]*)"/g, '="<span style="color:#8387ff">$1</span>"');
    escaped = escaped.replace(/(&gt;)/g, '<span style="color:#a28efc">$1</span>');
    if (lang === 'pug') {
      // pug tags (word at start of line)
      escaped = escaped.replace(/^(\s*)([\w\-#.]+)/gm, '$1<span style="color:#a28efc">$2</span>');
    }
  } else if (lang === 'css' || lang === 'scss') {
    escaped = escaped.replace(/([.#&]?[\w\-]+)\s*\{/g, '<span style="color:#ffa5d9">$1</span> {');
    escaped = escaped.replace(/([\w\-]+):/g, '<span style="color:#a28efc">$1</span>:');
    escaped = escaped.replace(/:\s*([^;{}\n]+)/g, ': <span style="color:#8387ff">$1</span>');
    if (lang === 'scss') {
      // scss variables
      escaped = escaped.replace(/(\$[\w\-]+)/g, '<span style="color:#ffa5d9">$1</span>');
      // @mixin @include etc
      escaped = escaped.replace(/(@[\w\-]+)/g, '<span style="color:#a3a6ff">$1</span>');
    }
  } else if (lang === 'js') {
    escaped = escaped.replace(/\b(const|let|var|function|return|import|export|default|from|if|else|async|await|new|class|extends)\b/g,
      '<span style="color:#a28efc">$1</span>');
    escaped = escaped.replace(/('.*?'|".*?"|`.*?`)/g, '<span style="color:#8387ff">$1</span>');
    escaped = escaped.replace(/\/\/.*/g, '<span style="color:#76757a">$&</span>');
  }
  return escaped;
}

const ALL_TABS = ['preview', 'html', 'css', 'js', 'pug', 'scss'];

export default function TemplateViewer({ params }) {
  const { name } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'preview';
  const fromPage = searchParams.get('from') || '1';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [code, setCode] = useState({});
  const [availableTabs, setAvailableTabs] = useState(['preview']);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      const { files } = await fetch(`/api/templates/${name}/files`).then(r => r.json());
      const results = await Promise.all(
        files.map(tab =>
          fetch(`/api/templates/${name}?file=${tab}`)
            .then(r => r.ok ? r.json().then(d => ({ tab, content: d.content })) : null)
        )
      );

      const newCode = {};
      const tabs = ['preview'];
      results.forEach(r => {
        if (r) {
          newCode[r.tab] = r.content;
          tabs.push(r.tab);
        }
      });

      setCode(newCode);
      setAvailableTabs(tabs);
    }
    fetchAll();
  }, [name]);

  const isPreview = activeTab === 'preview';
  const currentCode = code[activeTab] || '';
  const lines = currentCode.split('\n');
  const displayName = name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ backgroundColor: '#0e0e12', minHeight: '100vh' }}>
      {/* Dimmed background */}
      <div className="pt-32 pb-20 px-8 mx-auto opacity-20 pointer-events-none select-none" style={{ maxWidth: '1280px' }}>
        <div className="grid grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl" style={{ aspectRatio: i % 2 === 0 ? '16/9' : '1/1', backgroundColor: '#19191e' }} />
          ))}
        </div>
      </div>

      {/* Modal overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>

        <div className="relative w-full flex flex-col overflow-hidden"
          style={{
            maxWidth: '900px',
            height: '82vh',
            backgroundColor: '#19191e',
            borderRadius: '0.5rem',
            border: '1px solid rgba(72,71,76,0.2)',
            boxShadow: '0 24px 48px rgba(252,248,254,0.06)',
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(72,71,76,0.1)', backgroundColor: '#1f1f24' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: '#a3a6ff' }}>
                {isPreview ? 'preview' : 'terminal'}
              </span>
              <h2 className="font-bold text-lg tracking-tight text-white" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {displayName}{isPreview ? ' — Preview' : '.jsx'}
              </h2>
            </div>
            <button onClick={() => router.push(fromPage === '1' ? '/' : `/?page=${fromPage}`, { scroll: false })} className="p-2 rounded-full transition-colors hover:text-white" style={{ color: '#acaab0' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Tabs + Copy */}
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-2"
            style={{ backgroundColor: '#19191e', borderBottom: '1px solid rgba(72,71,76,0.1)' }}>
            <div className="flex items-center gap-1 overflow-x-auto">
              {availableTabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-5 py-3 uppercase transition-all whitespace-nowrap"
                  style={{
                    fontFamily: 'Space Grotesk',
                    fontSize: '12px',
                    letterSpacing: '0.1em',
                    borderBottom: activeTab === tab ? '2px solid #a3a6ff' : '2px solid transparent',
                    color: activeTab === tab ? '#a3a6ff' : '#acaab0',
                    backgroundColor: activeTab === tab ? '#1f1f24' : 'transparent',
                    borderRadius: '4px 4px 0 0',
                  }}>
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            {!isPreview && (
              <button onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 font-bold active:scale-95 transition-all mt-2 md:mt-0 flex-shrink-0"
                style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: '12px',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, #a3a6ff, #6063ee)',
                  color: '#000000',
                  boxShadow: '0 4px 15px rgba(163,166,255,0.2)',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isPreview ? (
              <iframe
                src={`/templates/${name}/index.html`}
                title={`${displayName} preview`}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            ) : (
              <div className="flex h-full overflow-auto" style={{ backgroundColor: '#000000' }}>
                {/* Line numbers */}
                <div className="flex flex-col items-end py-6 px-3 select-none flex-shrink-0"
                  style={{
                    minWidth: '48px',
                    backgroundColor: '#000000',
                    borderRight: '1px solid rgba(72,71,76,0.1)',
                    fontFamily: 'Space Grotesk',
                    fontSize: '12px',
                    color: '#48474c',
                    lineHeight: '1.625',
                  }}>
                  {lines.map((_, i) => <span key={i}>{i + 1}</span>)}
                </div>
                {/* Code */}
                <pre className="flex-1 py-6 px-6 text-sm overflow-auto"
                  style={{
                    fontFamily: 'Space Grotesk, monospace',
                    lineHeight: '1.625',
                    color: '#fcf8fe',
                    margin: 0,
                    whiteSpace: 'pre',
                  }}
                  dangerouslySetInnerHTML={{ __html: highlight(currentCode, activeTab) }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3"
            style={{ backgroundColor: '#131317', borderTop: '1px solid rgba(72,71,76,0.1)' }}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#a3a6ff' }} />
                <span className="uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk', fontSize: '10px', color: '#acaab0' }}>Tailwind CSS 3.4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ffa5d9' }} />
                <span className="uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk', fontSize: '10px', color: '#acaab0' }}>Accessible</span>
              </div>
            </div>
            <span className="uppercase" style={{ fontFamily: 'Space Grotesk', fontSize: '10px', color: '#76757a' }}>{displayName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
