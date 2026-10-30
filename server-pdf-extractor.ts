import zlib from 'zlib';

/**
 * Extracts balanced parenthesis string literal from PDF stream at given index.
 */
function extractPdfString(str: string, startIndex: number): { text: string; nextIndex: number } | null {
  if (str[startIndex] !== '(') return null;
  let depth = 0;
  let result = '';
  let i = startIndex;

  while (i < str.length) {
    const char = str[i];
    if (char === '\\') {
      if (i + 1 < str.length) {
        const nextChar = str[i + 1];
        if (nextChar === '(' || nextChar === ')' || nextChar === '\\') {
          result += nextChar;
        } else if (nextChar === 'n') {
          result += '\n';
        } else if (nextChar === 'r') {
          result += '\r';
        } else if (nextChar === 't') {
          result += '\t';
        } else {
          result += nextChar;
        }
        i += 2;
        continue;
      }
    } else if (char === '(') {
      if (depth > 0) result += char;
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0) {
        // Peek ahead to ensure this is truly the end of string and not an unescaped inline ')'
        const remainder = str.substring(i + 1, i + 20).trimStart();
        if (/^(?:Tj|'|"|T\*|ET|Td|TD|Tm|\]|\r|\n|$)/.test(remainder)) {
          return { text: result, nextIndex: i + 1 };
        }
        depth++;
        result += char;
      } else {
        result += char;
      }
    } else {
      result += char;
    }
    i++;
  }

  return { text: result, nextIndex: i };
}

/**
 * Robust pure Node.js PDF text extractor.
 * Handles FlateDecode decompression, TJ arrays, Tj operators,
 * escaped & unescaped parentheses, hex-encoded text, and plain text fallbacks.
 */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  const content = buffer.toString('binary');
  const extractedLines: string[] = [];

  // Match all stream objects in the PDF
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(content)) !== null) {
    const rawStream = Buffer.from(match[1], 'binary');
    let decoded = '';

    // 1. Try zlib decompression (FlateDecode)
    try {
      decoded = zlib.inflateSync(rawStream).toString('utf-8');
    } catch {
      try {
        decoded = zlib.inflateRawSync(rawStream).toString('utf-8');
      } catch {
        try {
          decoded = zlib.unzipSync(rawStream).toString('utf-8');
        } catch {
          // Uncompressed or raw latin1 text
          decoded = rawStream.toString('latin1');
        }
      }
    }

    if (!decoded || decoded.length < 5) continue;

    // 2. Parse text objects (BT ... ET) or direct operators
    let i = 0;
    while (i < decoded.length) {
      if (decoded[i] === '(') {
        const parsed = extractPdfString(decoded, i);
        if (parsed) {
          i = parsed.nextIndex;
          const remainder = decoded.substring(i, i + 15).trim();
          if (/^(?:Tj|'|"|T\*)/.test(remainder)) {
            const line = parsed.text.trim();
            if (line) extractedLines.push(line);
          }
          continue;
        }
      } else if (decoded[i] === '[') {
        const closeIdx = decoded.indexOf(']', i);
        if (closeIdx !== -1) {
          const remainder = decoded.substring(closeIdx, closeIdx + 15).trim();
          if (/^\]\s*TJ/i.test(remainder)) {
            const arrayChunk = decoded.substring(i + 1, closeIdx);
            let chunkIdx = 0;
            let fullChunkText = '';
            while (chunkIdx < arrayChunk.length) {
              if (arrayChunk[chunkIdx] === '(') {
                const p = extractPdfString(arrayChunk, chunkIdx);
                if (p) {
                  fullChunkText += p.text;
                  chunkIdx = p.nextIndex;
                  continue;
                }
              }
              chunkIdx++;
            }
            if (fullChunkText.trim()) {
              extractedLines.push(fullChunkText.trim());
            }
            i = closeIdx + 3;
            continue;
          }
        }
      } else if (decoded[i] === '<' && decoded[i + 1] !== '<') {
        const endHex = decoded.indexOf('>', i);
        if (endHex !== -1) {
          const hexContent = decoded.substring(i + 1, endHex).replace(/\s+/g, '');
          const remainder = decoded.substring(endHex + 1, endHex + 15).trim();
          if (/^(?:Tj|'|")/i.test(remainder)) {
            try {
              const hexBuf = Buffer.from(hexContent, 'hex');
              let hexStr = '';
              if (hexContent.length % 4 === 0 && hexContent.startsWith('00')) {
                hexStr = hexBuf.swap16().toString('utf16le');
              } else {
                hexStr = hexBuf.toString('utf-8');
              }
              if (hexStr.trim()) extractedLines.push(hexStr.trim());
            } catch { }
            i = endHex + 1;
            continue;
          }
        }
      }
      i++;
    }
  }

  // 3. Fallback: If no structured text operators found in streams, try raw parenthesis extraction
  if (extractedLines.length === 0) {
    let pIdx = 0;
    while (pIdx < content.length) {
      if (content[pIdx] === '(') {
        const parsed = extractPdfString(content, pIdx);
        if (parsed) {
          pIdx = parsed.nextIndex;
          const txt = parsed.text.trim();
          if (
            txt.length > 2 &&
            !txt.startsWith('Adobe') &&
            !txt.includes('CreationDate') &&
            !txt.includes('Producer') &&
            !txt.includes('Font') &&
            !txt.includes('Length')
          ) {
            extractedLines.push(txt);
          }
          continue;
        }
      }
      pIdx++;
    }
  }

  return extractedLines.join('\n');
}

