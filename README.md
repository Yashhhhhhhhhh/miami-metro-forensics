# Atlas Research Space

A dependency-free research workspace that aggregates public evidence from multiple open sources and organizes it into a saved dossier interface.

## What it does

- Searches Wikipedia, Wikidata, OpenAlex, Crossref, Wikimedia Commons, and the Internet Archive.
- Groups results by evidence type so it is easier to compare public references, media, and scholarship.
- Saves notes and dossiers in local browser storage.
- Exports the current investigation as JSON.

## Run locally

1. Open a terminal in this folder.
2. Start a local server:

```powershell
python -m http.server 8000
```

3. Open `http://localhost:8000` in a browser.

## Notes

- This is a public-source research workspace, not a guaranteed full-web crawler.
- If you want true web-wide coverage, the next step is to connect a search API key and a crawler pipeline.
