export function extractMetadata(document: Document): Record<string, any> {
    const metadata: Record<string, any> = {};

    const titleElement = document.querySelector('.fic-title h1');
    if (titleElement) {
        metadata.title = titleElement.textContent?.trim();
    }

    const authorElement = document.querySelector('.fic-title a');
    if (authorElement) {
        metadata.author = authorElement.textContent?.trim();
    }

    const canonicalLinkElement = document.querySelector('link[rel="canonical"]');
    if (canonicalLinkElement) {
        metadata.canonicalUrl = canonicalLinkElement.getAttribute('href');
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

export default extractMetadata;
