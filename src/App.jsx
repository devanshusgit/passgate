import { useState, useRef, useCallback } from 'react'
import * as mammoth from 'mammoth'
import * as pdfjs from 'pdfjs-dist'

// Use CDN worker so we don't need to bundle it
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Instrument+Sans:wght@400;500;600&display=swap');

  :root {
    --paper: #F7F4EF;
    --ink: #0F0E0C;
    --accent: #E8400C;
    --green: #1A7A40;
    --amber: #8A6200;
    --red: #C0241C;
    --border: 1.5px solid #0F0E0C;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--paper); color: var(--ink); font-family: 'Instrument Sans', sans-serif; }

  .pg-wrap { max-width: 900px; margin: 0 auto; padding: 0 20px 80px; }

  /* HEADER */
  .pg-header {
    position: sticky; top: 0; z-index: 100;
    height: 58px; background: var(--paper);
    border-bottom: var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
  }
  .pg-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--ink); }
  .pg-logo-mark {
    width: 32px; height: 32px; background: var(--ink); color: var(--paper);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.05em;
  }
  .pg-logo-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 17px; }
  .pg-tag {
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em;
    border: 1px solid var(--ink); padding: 4px 10px; text-transform: uppercase;
  }

  /* HERO */
  .pg-hero { padding: 64px 0 48px; border-bottom: var(--border); }
  .pg-hero-label { font-family: 'DM Mono', monospace; font-size: 13px; color: #555; margin-bottom: 20px; }
  .pg-hero-headline {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: clamp(52px, 9vw, 88px);
    line-height: 1.0; letter-spacing: -0.02em;
    margin-bottom: 22px;
  }
  .pg-underline {
    position: relative; display: inline-block;
  }
  .pg-underline::after {
    content: ''; position: absolute; bottom: 4px; left: 0; right: 0;
    height: 4px; background: var(--accent);
  }
  .pg-hero-sub {
    font-size: 17px; line-height: 1.6; color: #333; max-width: 560px;
  }

  /* HOW IT WORKS */
  .pg-how { padding: 32px 0; border-bottom: var(--border); display: flex; gap: 0; flex-wrap: wrap; }
  .pg-how-step {
    flex: 1; min-width: 140px; padding: 16px 20px;
    border-right: 1px solid #ccc;
    display: flex; flex-direction: column; gap: 6px;
  }
  .pg-how-step:last-child { border-right: none; }
  .pg-how-icon { font-size: 20px; }
  .pg-how-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.12em; color: #666; text-transform: uppercase; }
  .pg-how-desc { font-size: 13px; color: #333; }

  /* SECTIONS */
  .pg-section {
    margin-top: 36px; border: var(--border); position: relative;
  }
  .pg-section-tab {
    position: absolute; top: -1px; left: -1px;
    background: var(--ink); color: var(--paper);
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.18em;
    padding: 5px 14px; text-transform: uppercase;
  }
  .pg-section-body { padding: 52px 28px 28px; }

  /* DROP ZONE */
  .pg-drop {
    border: 2px dashed #999; padding: 40px 24px;
    text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s;
    position: relative;
  }
  .pg-drop:hover, .pg-drop.active { border-color: var(--ink); background: rgba(15,14,12,0.03); }
  .pg-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .pg-drop-icon { font-size: 32px; margin-bottom: 10px; }
  .pg-drop-label { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; margin-bottom: 6px; }
  .pg-drop-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: #666; }

  /* FILE FORMATS */
  .pg-formats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px; }
  .pg-fmt {
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.1em;
    border: 1px solid #bbb; padding: 3px 9px; text-transform: uppercase; color: #555;
  }

  /* FILE PILL */
  .pg-file-pill {
    display: flex; align-items: center; gap: 10px;
    border: var(--border); padding: 12px 16px; margin-top: 14px;
    background: #fff;
  }
  .pg-file-ext {
    background: var(--ink); color: var(--paper);
    font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em;
    padding: 3px 7px; text-transform: uppercase; flex-shrink: 0;
  }
  .pg-file-name { font-size: 13px; font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pg-file-size { font-family: 'DM Mono', monospace; font-size: 11px; color: #666; flex-shrink: 0; }
  .pg-file-rm {
    background: none; border: none; cursor: pointer; font-size: 16px; color: #888;
    padding: 0 4px; line-height: 1; flex-shrink: 0;
  }
  .pg-file-rm:hover { color: var(--red); }

  /* PROGRESS BAR */
  .pg-progress { margin-top: 14px; }
  .pg-progress-label { font-family: 'DM Mono', monospace; font-size: 11px; color: #555; margin-bottom: 6px; }
  .pg-progress-bar { height: 3px; background: #ddd; }
  .pg-progress-fill { height: 100%; background: var(--ink); transition: width 0.4s ease; }

  /* JD TEXTAREA */
  .pg-jd-area {
    width: 100%; height: 150px; resize: vertical;
    border: 1px solid #ccc; padding: 14px;
    font-family: 'DM Mono', monospace; font-size: 13px; line-height: 1.6;
    background: #fff; color: var(--ink); outline: none;
    transition: border-color 0.2s;
  }
  .pg-jd-area:focus { border-color: var(--ink); }
  .pg-char-count { font-family: 'DM Mono', monospace; font-size: 11px; color: #888; text-align: right; margin-top: 6px; }

  /* SCAN BUTTON */
  .pg-scan-btn {
    width: 100%; height: 62px; margin-top: 32px;
    background: var(--ink); color: var(--paper); border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px;
    letter-spacing: 0.2em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    transition: background 0.2s;
  }
  .pg-scan-btn:hover:not(:disabled) { background: var(--accent); }
  .pg-scan-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* SPINNER */
  .pg-spinner {
    width: 18px; height: 18px; border: 2px solid rgba(247,244,239,0.4);
    border-top-color: var(--paper); border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* SCAN STATUS */
  .pg-scan-status { font-family: 'DM Mono', monospace; font-size: 12px; color: #555; text-align: center; margin-top: 10px; }

  /* ERROR BANNER */
  .pg-error {
    margin-top: 24px; padding: 16px 20px;
    border: 1.5px solid var(--red); background: #fff5f5;
    font-family: 'DM Mono', monospace; font-size: 12px; color: var(--red);
  }

  /* RESULTS */
  .pg-results { margin-top: 40px; }
  .pg-results-label {
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.2em;
    text-transform: uppercase; color: #888; margin-bottom: 16px;
  }

  /* VERDICT CARD */
  .pg-verdict {
    border: var(--border); padding: 36px 32px; position: relative; margin-bottom: 24px;
  }
  .pg-verdict.pass { border-color: var(--green); background: #f0fff6; }
  .pg-verdict.partial { border-color: var(--amber); background: #fffbf0; }
  .pg-verdict.fail { border-color: var(--red); background: #fff5f5; }

  .pg-verdict-badge {
    position: absolute; top: 16px; right: 16px;
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em;
    padding: 4px 10px; text-transform: uppercase;
  }
  .pass .pg-verdict-badge { background: var(--green); color: #fff; }
  .partial .pg-verdict-badge { background: var(--amber); color: #fff; }
  .fail .pg-verdict-badge { background: var(--red); color: #fff; }

  .pg-score-num {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 84px; line-height: 1;
    letter-spacing: -0.03em;
  }
  .pass .pg-score-num { color: var(--green); }
  .partial .pg-score-num { color: var(--amber); }
  .fail .pg-score-num { color: var(--red); }

  .pg-score-label {
    font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.2em;
    text-transform: uppercase; margin-top: 4px; margin-bottom: 16px;
  }
  .pass .pg-score-label { color: var(--green); }
  .partial .pg-score-label { color: var(--amber); }
  .fail .pg-score-label { color: var(--red); }

  .pg-summary { font-size: 15px; line-height: 1.65; color: #333; max-width: 620px; }

  /* 2-COL GRID */
  .pg-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  @media (max-width: 620px) {
    .pg-grid2 { grid-template-columns: 1fr; }
    .pg-hero-headline { font-size: clamp(40px, 12vw, 64px); }
    .pg-how { flex-direction: column; }
    .pg-how-step { border-right: none; border-bottom: 1px solid #ccc; }
    .pg-how-step:last-child { border-bottom: none; }
  }

  /* PANEL */
  .pg-panel { border: var(--border); }
  .pg-panel-head {
    padding: 10px 16px; border-bottom: var(--border);
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em;
    text-transform: uppercase; display: flex; align-items: center; gap: 8px;
  }
  .pg-panel-body { padding: 16px; }

  /* KEYWORD CHIPS */
  .pg-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .pg-chip {
    font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.05em;
    padding: 4px 10px; border-radius: 0;
  }
  .pg-chip.found { border: 1px solid var(--green); color: var(--green); background: #f0fff6; }
  .pg-chip.missing { border: 1px solid var(--red); color: var(--red); background: #fff5f5; }

  /* BULLET REWRITES */
  .pg-rewrite { margin-bottom: 18px; }
  .pg-rewrite:last-child { margin-bottom: 0; }
  .pg-rewrite-before {
    font-family: 'DM Mono', monospace; font-size: 11px; font-style: italic;
    color: var(--red); padding: 8px 10px; border-left: 3px solid var(--red);
    background: #fff5f5; margin-bottom: 6px; line-height: 1.5;
  }
  .pg-rewrite-after {
    font-family: 'DM Mono', monospace; font-size: 11px;
    color: var(--green); padding: 8px 10px; border-left: 3px solid var(--green);
    background: #f0fff6; line-height: 1.5; font-weight: 500;
  }
  .pg-rewrite-arrow {
    font-family: 'DM Mono', monospace; font-size: 10px; color: #888;
    margin-bottom: 4px;
  }

  /* ACTION ITEMS */
  .pg-action-list { list-style: none; }
  .pg-action-item {
    display: flex; gap: 12px; padding: 10px 0;
    border-bottom: 1px solid #e5e2dd; font-size: 13px; line-height: 1.5;
  }
  .pg-action-item:last-child { border-bottom: none; }
  .pg-action-num {
    font-family: 'DM Mono', monospace; font-size: 11px; color: #888;
    flex-shrink: 0; padding-top: 1px;
  }

  /* FOOTER */
  .pg-footer {
    margin-top: 80px; padding: 20px 0;
    border-top: var(--border);
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.12em;
    color: #888; text-align: center;
  }
`

const FORMATS = ['PDF', 'DOCX', 'DOC', 'JPG', 'JPEG', 'PNG', 'Scanned']

const HOW_STEPS = [
  { icon: '📂', label: 'Upload', desc: 'Drop your resume in any format' },
  { icon: '🔍', label: 'Extract', desc: 'Text pulled from PDF, DOCX, or image' },
  { icon: '✨', label: 'Gemini Reads', desc: 'AI analyzes against the JD' },
  { icon: '📊', label: 'Score + Fixes', desc: 'Get your score and rewrites' },
]

const SCAN_STEPS = [
  'Reading resume...',
  'Extracting content...',
  'Sending to Gemini AI...',
  'Analyzing keywords...',
  'Generating rewrites...',
  'Building your report...',
]

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getExt(name) {
  return name.split('.').pop().toUpperCase()
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result.split(',')[1]
      resolve(b64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function extractResumeContent(file) {
  const ext = getExt(file.name).toLowerCase()

  if (ext === 'docx' || ext === 'doc') {
    const buf = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    return { text: result.value }
  }

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ') + '\n'
    }
    return { text: text.trim() || 'Could not extract text from PDF — try a DOCX version.' }
  }

  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    const b64 = await fileToBase64(file)
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
    return { image: b64, imageMime: mime }
  }

  throw new Error('Unsupported file type: ' + ext)
}

export default function App() {
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [dragging, setDragging] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef()

  const handleFile = useCallback((f) => {
    if (!f) return
    const allowed = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png']
    const ext = f.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) {
      setError('Unsupported file type. Please upload PDF, DOCX, DOC, JPG, or PNG.')
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const onInputChange = (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0])
  }

  const removeFile = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const canScan = file && jd.trim().length > 20 && !scanning

  const runScan = async () => {
    if (!canScan) return
    setScanning(true)
    setError(null)
    setResult(null)

    let stepIdx = 0
    setScanStep(SCAN_STEPS[0])
    setProgress(10)

    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, SCAN_STEPS.length - 1)
      setScanStep(SCAN_STEPS[stepIdx])
      setProgress(Math.min(10 + stepIdx * 15, 85))
    }, 800)

    try {
      const content = await extractResumeContent(file)

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: content.text,
          resumeImage: content.image,
          resumeImageMime: content.imageMime,
          jobDescription: jd
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Scan failed. Please try again.')
      }

      clearInterval(stepInterval)
      setProgress(100)
      setScanStep('Done!')
      setTimeout(() => {
        setResult(data)
        setScanning(false)
      }, 400)

    } catch (err) {
      clearInterval(stepInterval)
      setError(err.message || 'Something went wrong. Please try again.')
      setScanning(false)
      setProgress(0)
    }
  }

  const verdictClass = result
    ? result.verdict === 'PASS' ? 'pass' : result.verdict === 'PARTIAL' ? 'partial' : 'fail'
    : ''

  return (
    <>
      <style>{S}</style>

      {/* HEADER */}
      <header className="pg-header">
        <a className="pg-logo" href="/">
          <div className="pg-logo-mark">PG</div>
          <span className="pg-logo-name">PassGate</span>
        </a>
        <div className="pg-tag">ATS Scanner · Groq · Free</div>
      </header>

      <div className="pg-wrap">

        {/* HERO */}
        <section className="pg-hero">
          <div className="pg-hero-label">// Will your resume pass the filter?</div>
          <h1 className="pg-hero-headline">
            Know before<br />you <span className="pg-underline">apply.</span>
          </h1>
          <p className="pg-hero-sub">
            Upload your resume and paste a job description. PassGate uses Gemini AI to score your ATS compatibility, find missing keywords, rewrite weak bullets, and tell you exactly what to fix.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <div className="pg-how">
          {HOW_STEPS.map((s, i) => (
            <div className="pg-how-step" key={i}>
              <div className="pg-how-icon">{s.icon}</div>
              <div className="pg-how-label">{s.label}</div>
              <div className="pg-how-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* STEP 01 — RESUME UPLOAD */}
        <div className="pg-section">
          <div className="pg-section-tab">01 — Upload Resume</div>
          <div className="pg-section-body">
            <div
              className={`pg-drop${dragging ? ' active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                onChange={onInputChange}
                style={{ display: 'none' }}
              />
              <div className="pg-drop-icon">📄</div>
              <div className="pg-drop-label">
                {file ? 'File selected' : 'Drop your resume here or click to browse'}
              </div>
              <div className="pg-drop-sub">
                {file ? 'Click × to remove and upload a different file' : 'Max 10MB · PDF, DOCX, DOC, JPG, PNG'}
              </div>
            </div>

            {file && (
              <div className="pg-file-pill">
                <span className="pg-file-ext">{getExt(file.name)}</span>
                <span className="pg-file-name">{file.name}</span>
                <span className="pg-file-size">{formatBytes(file.size)}</span>
                <button className="pg-file-rm" onClick={removeFile} title="Remove file">×</button>
              </div>
            )}

            {scanning && (
              <div className="pg-progress">
                <div className="pg-progress-label">{scanStep}</div>
                <div className="pg-progress-bar">
                  <div className="pg-progress-fill" style={{ width: progress + '%' }} />
                </div>
              </div>
            )}

            <div className="pg-formats">
              {FORMATS.map(f => <span className="pg-fmt" key={f}>{f}</span>)}
            </div>
          </div>
        </div>

        {/* STEP 02 — JOB DESCRIPTION */}
        <div className="pg-section">
          <div className="pg-section-tab">02 — Job Description</div>
          <div className="pg-section-body">
            <textarea
              className="pg-jd-area"
              placeholder="Paste the full job description you're targeting..."
              value={jd}
              onChange={e => setJd(e.target.value)}
            />
            <div className="pg-char-count">{jd.length} chars</div>
          </div>
        </div>

        {/* SCAN BUTTON */}
        <button className="pg-scan-btn" onClick={runScan} disabled={!canScan}>
          {scanning ? (
            <>
              <div className="pg-spinner" />
              Scanning...
            </>
          ) : (
            '→ Run ATS Scan'
          )}
        </button>

        {scanning && (
          <div className="pg-scan-status">{scanStep}</div>
        )}

        {/* ERROR */}
        {error && (
          <div className="pg-error">
            ⚠ {error}
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div className="pg-results">
            <div className="pg-results-label">// Scan results</div>

            {/* VERDICT CARD */}
            <div className={`pg-verdict ${verdictClass}`}>
              <div className="pg-verdict-badge">{result.verdict}</div>
              <div className="pg-score-num">{result.score}</div>
              <div className="pg-score-label">ATS Compatibility Score</div>
              <p className="pg-summary">{result.summary}</p>
            </div>

            {/* KEYWORDS GRID */}
            <div className="pg-grid2">
              <div className="pg-panel">
                <div className="pg-panel-head">
                  <span style={{ color: 'var(--green)' }}>✓</span> Keywords Found
                </div>
                <div className="pg-panel-body">
                  <div className="pg-chips">
                    {(result.keywords_found || []).map((k, i) => (
                      <span className="pg-chip found" key={i}>{k}</span>
                    ))}
                    {(!result.keywords_found?.length) && (
                      <span style={{ fontSize: 12, color: '#888' }}>None detected</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pg-panel">
                <div className="pg-panel-head">
                  <span style={{ color: 'var(--red)' }}>✗</span> Keywords Missing
                </div>
                <div className="pg-panel-body">
                  <div className="pg-chips">
                    {(result.keywords_missing || []).map((k, i) => (
                      <span className="pg-chip missing" key={i}>{k}</span>
                    ))}
                    {(!result.keywords_missing?.length) && (
                      <span style={{ fontSize: 12, color: '#888' }}>Great — nothing missing!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* REWRITES + ACTION ITEMS GRID */}
            <div className="pg-grid2">
              <div className="pg-panel">
                <div className="pg-panel-head">
                  ↻ Bullet Rewrites
                </div>
                <div className="pg-panel-body">
                  {(result.bullet_rewrites || []).map((r, i) => (
                    <div className="pg-rewrite" key={i}>
                      <div className="pg-rewrite-before">{r.before}</div>
                      <div className="pg-rewrite-arrow">↓ rewritten</div>
                      <div className="pg-rewrite-after">{r.after}</div>
                    </div>
                  ))}
                  {(!result.bullet_rewrites?.length) && (
                    <span style={{ fontSize: 12, color: '#888' }}>No rewrites needed</span>
                  )}
                </div>
              </div>

              <div className="pg-panel">
                <div className="pg-panel-head">
                  → Action Items
                </div>
                <div className="pg-panel-body">
                  <ol className="pg-action-list">
                    {(result.action_items || []).map((a, i) => (
                      <li className="pg-action-item" key={i}>
                        <span className="pg-action-num">0{i + 1}</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="pg-footer">
          PASSGATE · GROQ FREE TIER · 14,400 SCANS/DAY · ZERO COST
        </footer>
      </div>
    </>
  )
}
