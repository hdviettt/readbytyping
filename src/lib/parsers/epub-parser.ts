import { chunkText, type TextChunk } from "./text-chunker";

export interface ParsedChapter {
  title: string;
  pages: TextChunk[];
}

export interface ParsedBook {
  title: string;
  author: string | null;
  chapters: ParsedChapter[];
}

export async function parseEpub(file: File): Promise<ParsedBook> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  // Build a case-insensitive path lookup
  const zipPaths = new Map<string, string>();
  zip.forEach((relativePath) => {
    zipPaths.set(relativePath.toLowerCase(), relativePath);
  });

  function getZipFile(path: string) {
    // Try exact path first, then case-insensitive
    return zip.file(path) || zip.file(zipPaths.get(path.toLowerCase()) || "");
  }

  // Parse container.xml to find the OPF file
  const containerXml = await getZipFile("META-INF/container.xml")?.async("string");
  if (!containerXml) throw new Error("Invalid EPUB: missing container.xml");

  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfPathMatch) throw new Error("Invalid EPUB: cannot find OPF path");
  const opfPath = opfPathMatch[1];
  const opfDir = opfPath.includes("/")
    ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1)
    : "";

  const opfXml = await getZipFile(opfPath)?.async("string");
  if (!opfXml) throw new Error("Invalid EPUB: missing OPF file");

  // Parse metadata
  const titleMatch = opfXml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
  const authorMatch = opfXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
  const title = titleMatch?.[1]?.trim() || "Untitled";
  const author = authorMatch?.[1]?.trim() || null;

  // Parse spine to get reading order
  const spineMatch = opfXml.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i);
  if (!spineMatch) throw new Error("Invalid EPUB: missing spine");

  const itemrefIds: string[] = [];
  const itemrefRegex = /idref="([^"]+)"/g;
  let m;
  while ((m = itemrefRegex.exec(spineMatch[1])) !== null) {
    itemrefIds.push(m[1]);
  }

  // Parse manifest to map ids to hrefs
  const manifestMatch = opfXml.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/i);
  if (!manifestMatch) throw new Error("Invalid EPUB: missing manifest");

  const idToHref = new Map<string, string>();
  // Match each <item .../> or <item ...> tag
  const itemTagRegex = /<item\s[^>]*?\/?>/gi;
  let itemMatch;
  while ((itemMatch = itemTagRegex.exec(manifestMatch[1])) !== null) {
    const tag = itemMatch[0];
    const idM = tag.match(/\bid="([^"]+)"/);
    const hrefM = tag.match(/\bhref="([^"]+)"/);
    if (idM && hrefM) {
      idToHref.set(idM[1], hrefM[1]);
    }
  }

  // Read each spine item and extract text
  const chapters: ParsedChapter[] = [];

  for (const id of itemrefIds) {
    const href = idToHref.get(id);
    if (!href) continue;

    // Resolve the path relative to the OPF directory
    const decodedHref = decodeURIComponent(href);
    const filePath = decodedHref.startsWith("/")
      ? decodedHref.slice(1)
      : opfDir + decodedHref;

    const zipEntry = getZipFile(filePath);
    if (!zipEntry) continue;

    const html = await zipEntry.async("string");
    if (!html) continue;

    const plainText = htmlToPlainText(html).trim();
    if (!plainText || plainText.length < 20) continue;

    const pages = chunkText(plainText);
    if (pages.length === 0) continue;

    // Try to extract chapter title from the HTML
    const h1Match = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    const chapterTitle = h1Match
      ? h1Match[1].replace(/<[^>]+>/g, "").trim()
      : `Chapter ${chapters.length + 1}`;

    chapters.push({ title: chapterTitle || `Chapter ${chapters.length + 1}`, pages });
  }

  return { title, author, chapters };
}

function htmlToPlainText(html: string): string {
  // Remove everything in <head>
  let text = html.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");
  // Remove scripts and styles
  text = text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|blockquote|tr|section|article)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#0?39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&mdash;/g, "\u2014");
  text = text.replace(/&ndash;/g, "\u2013");
  text = text.replace(/&hellip;/g, "\u2026");
  text = text.replace(/&lsquo;/g, "\u2018");
  text = text.replace(/&rsquo;/g, "\u2019");
  text = text.replace(/&ldquo;/g, "\u201C");
  text = text.replace(/&rdquo;/g, "\u201D");
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  // Collapse whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/[ \t]{2,}/g, " ");
  // Trim lines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  return text.trim();
}
