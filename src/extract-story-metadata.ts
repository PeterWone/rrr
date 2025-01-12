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

    const chapters: Array<{ name: string, releaseDate: string }> = [];
    const chapterRows = document.querySelectorAll('#chapters tbody tr');
    chapterRows.forEach(row => {
        const nameElement = row.querySelector('td a');
        const dateElement = row.querySelector('td.text-right a time');
        if (nameElement && dateElement) {
            chapters.push({
                name: nameElement.textContent?.trim() || '',
                releaseDate: dateElement.getAttribute('datetime') || ''
            });
        }
    });
    metadata.chapters = chapters;

    return metadata;
}

export default extractMetadata;
