import axios from "axios";
import { JSDOM } from 'jsdom';

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const noCoverArt = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWUiIC8+PC9zdmc+';

export async function extractMetadata(document: Document): Promise<Record<string, any>> {
  const metadata: Record<string, any> = {};

  const titleElement = document.querySelector('.fic-title h1');
  if (titleElement) {
    metadata.title = titleElement.textContent?.trim();
  }

  const authorElement = document.querySelector('.fic-title a');
  if (authorElement) {
    metadata.author = authorElement.textContent?.trim();
  }

  const descriptionElement = document.querySelector('.description .hidden-content');
  if (descriptionElement) {
    metadata.description = `<blockquote>${descriptionElement.innerHTML.trim()}</blockquote>`;
  }

  const canonicalLinkElement = document.querySelector('link[rel="canonical"]');
  if (canonicalLinkElement) {
    metadata.canonicalUrl = canonicalLinkElement.getAttribute('href');
  }

  const coverArtElement = document.querySelector('meta[property="og:image"]');
  const coverArtUrl = coverArtElement?.getAttribute('content');

  if (coverArtUrl) {
    if (coverArtUrl === '/dist/img/nocover-new-min.png') {
      metadata.coverArt = noCoverArt;
    } else {
      try {
        const response = await fetch(coverArtUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64String = await arrayBufferToBase64(arrayBuffer);
        metadata.coverArt = `data:${blob.type};base64,${base64String}`;
      } catch (error) {
        console.error('Error fetching cover art:', error);
      }
    }
  }

  const chapters: Array<{ name: string, datePublished: string, url: string, title: string }> = [];
  const chapterRows = document.querySelectorAll('#chapters tbody tr');
  chapterRows.forEach(row => {
    const nameElement = row.querySelector('td a');
    const dateElement = row.querySelector('td.text-right a time');
    if (nameElement && dateElement) {
      const name = nameElement.textContent?.trim() || '';
      chapters.push({
        name,
        datePublished: dateElement.getAttribute('datetime') || '',
        url: nameElement.getAttribute('href') || '',
        title: name
      });
    }
  });
  metadata.chapters = chapters;

  return metadata;
}

export async function extractCanonicalUrl(shortUrl: string): Promise<string | null> {
  const response = await axios.get(shortUrl);
  const dom = new JSDOM(response.data);
  const document = dom.window.document;
  const canonicalLinkElement = document.querySelector('link[rel="canonical"]');
  if (canonicalLinkElement) {
    return canonicalLinkElement.getAttribute('href');
  }
  return null;
}

export interface ChapterMeta {
  title: string;
  datePublished: string;
  url: string;
}

export default extractMetadata;
