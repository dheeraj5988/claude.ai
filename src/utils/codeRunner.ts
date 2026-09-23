/**
 * Prepares sandboxed HTML with console interceptor, Tailwind CDN, and Lucide icons.
 */
export function generateSandboxHtml(code: string, language: string): string {
  const cleanLang = (language || 'html').toLowerCase();

  // Injected script to capture console.log, console.error, console.warn and uncaught errors
  const consoleInterceptor = `
    <script>
      (function() {
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        const _info = console.info;

        function sendToParent(type, args) {
          try {
            const formatted = Array.from(args).map(arg => {
              if (typeof arg === 'object' && arg !== null) {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch (e) {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' ');

            window.parent.postMessage({
              source: 'dheeraj-claude-sandbox',
              type: type,
              content: formatted,
              timestamp: new Date().toLocaleTimeString()
            }, '*');
          } catch(e) {}
        }

        console.log = function(...args) { _log.apply(console, args); sendToParent('log', args); };
        console.warn = function(...args) { _warn.apply(console, args); sendToParent('warn', args); };
        console.error = function(...args) { _error.apply(console, args); sendToParent('error', args); };
        console.info = function(...args) { _info.apply(console, args); sendToParent('info', args); };

        window.addEventListener('error', function(event) {
          sendToParent('error', [event.message + ' at ' + (event.filename || '') + ':' + (event.lineno || '')]);
        });

        window.addEventListener('DOMContentLoaded', () => {
          if (window.lucide) {
            window.lucide.createIcons();
          }
        });
      })();
    </script>
  `;

  // Standard external scripts for web apps: Tailwind CSS and Lucide icons
  const extraHeadIncludes = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
  `;

  // 1. Full HTML document
  if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
    let result = code;
    if (result.includes('<head>')) {
      result = result.replace('<head>', `<head>${consoleInterceptor}${extraHeadIncludes}`);
    } else {
      result = `<head>${consoleInterceptor}${extraHeadIncludes}</head>` + result;
    }
    return result;
  }

  // 2. SVG
  if (cleanLang === 'svg' || code.trim().startsWith('<svg')) {
    return `<!DOCTYPE html>
<html>
<head>
  ${consoleInterceptor}
  ${extraHeadIncludes}
  <style>
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; padding: 20px; }
    svg { max-width: 100%; height: auto; filter: drop-shadow(0 10px 15px -3px rgba(0, 0, 0, 0.4)); }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
  }

  // 3. HTML Snippet / Component
  if (cleanLang === 'html' || cleanLang === 'xml') {
    return `<!DOCTYPE html>
<html>
<head>
  ${consoleInterceptor}
  ${extraHeadIncludes}
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-4">
  ${code}
</body>
</html>`;
  }

  // 4. Pure JavaScript
  if (cleanLang === 'javascript' || cleanLang === 'js') {
    return `<!DOCTYPE html>
<html>
<head>
  ${consoleInterceptor}
  ${extraHeadIncludes}
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-mono text-sm">
  <div id="output" class="p-4 bg-slate-900 rounded-lg border border-slate-800 mb-4">
    <h3 class="text-amber-400 font-bold mb-2">JavaScript Execution Sandbox</h3>
    <p class="text-slate-400 text-xs">Open the Console tab to view live stdout and returns.</p>
  </div>
  <script>
    try {
      ${code}
    } catch(err) {
      console.error(err.stack || err.message);
    }
  </script>
</body>
</html>`;
  }

  // 5. Default fallback
  return `<!DOCTYPE html>
<html>
<head>
  ${consoleInterceptor}
  ${extraHeadIncludes}
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-mono text-xs">
  <pre class="whitespace-pre-wrap">${escapeHtml(code)}</pre>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
