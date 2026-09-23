import { Artifact } from '../types';

export interface ParsedResponse {
  thought: string;
  isThinking: boolean;
  cleanContent: string;
  artifacts: Artifact[];
}

export function parseStreamContent(raw: string, messageId: string): ParsedResponse {
  let thought = '';
  let isThinking = false;
  let cleanContent = raw;

  // 1. Check for thinking tags <thought> ... </thought>
  if (raw.includes('<thought>')) {
    const startIdx = raw.indexOf('<thought>');
    const endIdx = raw.indexOf('</thought>');

    if (endIdx !== -1) {
      thought = raw.substring(startIdx + 9, endIdx).trim();
      cleanContent = (raw.substring(0, startIdx) + raw.substring(endIdx + 10)).trim();
      isThinking = false;
    } else {
      // Still in thinking mode!
      thought = raw.substring(startIdx + 9).trim();
      cleanContent = raw.substring(0, startIdx).trim();
      isThinking = true;
    }
  }

  // 2. Extract Artifacts
  const artifacts: Artifact[] = [];
  let artifactCount = 0;

  // Pattern A: Anthropic artifact XML style <antArtifact identifier="..." type="..." language="..." title="...">
  const antArtifactRegex = /<antArtifact\s+identifier="([^"]+)"(?:\s+type="([^"]+)")?(?:\s+language="([^"]+)")?(?:\s+title="([^"]+)")?>([\s\S]*?)<\/antArtifact>/gi;
  let antMatch;
  while ((antMatch = antArtifactRegex.exec(cleanContent)) !== null) {
    artifactCount++;
    const [fullMatch, identifier, typeAttr, langAttr, titleAttr, codeContent] = antMatch;
    const lang = (langAttr || 'typescript').toLowerCase();
    const isWebApp = lang === 'html' || lang === 'svg' || lang === 'javascript' || lang === 'tsx';

    artifacts.push({
      id: identifier || `art-${messageId}-${artifactCount}`,
      title: titleAttr || identifier || `Artifact ${artifactCount}`,
      filename: identifier.includes('.') ? identifier : `${identifier}.${lang === 'html' ? 'html' : 'js'}`,
      language: lang,
      code: codeContent.trim(),
      type: isWebApp ? (lang === 'svg' ? 'svg' : 'web-app') : 'code',
      messageId,
      version: 1,
    });
  }

  // Pattern B: Markdown code blocks with filename: ```lang:filename ... ```
  // Example: ```html:index.html
  const codeBlockNamedRegex = /```([a-zA-Z0-9_\-+]+):([a-zA-Z0-9_\-./]+)\n([\s\S]*?)```/g;
  let namedMatch;
  while ((namedMatch = codeBlockNamedRegex.exec(cleanContent)) !== null) {
    artifactCount++;
    const [, lang, filename, code] = namedMatch;
    const cleanLang = lang.toLowerCase();
    const isWebApp = cleanLang === 'html' || cleanLang === 'svg' || filename.endsWith('.html');

    artifacts.push({
      id: `art-${messageId}-${artifactCount}`,
      title: filename,
      filename,
      language: cleanLang,
      code: code.trim(),
      type: isWebApp ? (cleanLang === 'svg' ? 'svg' : 'web-app') : 'code',
      messageId,
      version: 1,
    });
  }

  // Pattern C: If no named artifact found, but there's a substantial HTML/SVG code block or multi-line app
  if (artifacts.length === 0) {
    const genericCodeBlockRegex = /```(html|svg|jsx|tsx|javascript|js|css|python|py)\n([\s\S]*?)```/g;
    let genericMatch;
    while ((genericMatch = genericCodeBlockRegex.exec(cleanContent)) !== null) {
      const [, lang, code] = genericMatch;
      const trimmedCode = code.trim();
      const lineCount = trimmedCode.split('\n').length;

      // If it's a substantive code block (> 10 lines or complete HTML)
      if (lineCount >= 10 || trimmedCode.includes('<!DOCTYPE') || trimmedCode.includes('<html') || trimmedCode.includes('<svg')) {
        artifactCount++;
        const ext = lang === 'html' ? 'html' : lang === 'svg' ? 'svg' : lang.startsWith('py') ? 'py' : 'js';
        const isWebApp = lang === 'html' || lang === 'svg';
        
        artifacts.push({
          id: `art-${messageId}-${artifactCount}`,
          title: `${capitalize(lang)} Application`,
          filename: `app.${ext}`,
          language: lang,
          code: trimmedCode,
          type: isWebApp ? (lang === 'svg' ? 'svg' : 'web-app') : 'code',
          messageId,
          version: 1,
        });
      }
    }
  }

  return {
    thought,
    isThinking,
    cleanContent,
    artifacts,
  };
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
