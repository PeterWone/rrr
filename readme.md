# Royal Road Ripper

Extract a story from Royal Road as a TOC file and chapter files in a folder named for the story.

# Installation

1. Clone the repo
2. Set the working directory to the root of the repo
3. `npm i`
4. `npm run build`
5. `npm link`

# Usage

The command syntax is as follows.

```
rrr <story-id> <optional-extraction-path>
```

The extraction location defaults to the current working directory. 

Find the story on Royal Road using a web browser. The story-id is a number in the URL. 

Within each story directory, TOC and chapter files will be created. The TOC has the name index.html and the chapter filenames are compounded from chapter names and their release dates.

If you run rrr again with the same parameters, already downloaded chapters are skipped, new chapters are fetched and the TOC is updated. The intended mode of use is scheduled daily. Your browser should show which chapters are unread using link colour.

All navigation URLs in these files are relative, so the folder is ready to be served by a webserver. Don't do this publicly without author approval.
