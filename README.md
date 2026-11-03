# ENA Experiment to Run Converter

A small, dependency-free GitHub Pages website that converts ENA experiment accessions, such as `ERX8831546`, to their associated run accessions, such as `ERR9289904`.

The site uses the official ENA Portal API. It does **not** scrape ENA record pages.

## Features

- accepts one `ERX`, `SRX` or `DRX` experiment accession per line
- preserves input order and duplicate entries
- returns multiple run accessions as a comma-separated value
- inserts `-` when no public run is returned
- copies results to the clipboard
- downloads experiment-to-run mappings as TSV
- works as a static GitHub Pages site, with no server or build step

## Publish on GitHub Pages

1. Create a new empty repository on GitHub, for example `ena-experiment-to-run`.
2. Extract this ZIP file.
3. Upload all extracted files to the repository root. Do not upload the enclosing folder itself.
4. Commit the files to the `main` branch.
5. Open **Settings > Pages** in the repository.
6. Under **Build and deployment**, select **Deploy from a branch**.
7. Select branch **main**, folder **/(root)**, then click **Save**.
8. After GitHub finishes deployment, the site will normally be available at `https://YOUR-USERNAME.github.io/ena-experiment-to-run/`.

## Upload with Git instead

```bash
git init
git add .
git commit -m "Initial ENA accession converter"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ena-experiment-to-run.git
git push -u origin main
```

Then enable GitHub Pages as described above.

## Test locally

Because browsers can restrict API requests from `file://` pages, serve the folder locally:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## API request

The application queries the ENA Portal API `search` endpoint with:

- `result=read_run`
- an OR query over `experiment_accession`
- `fields=experiment_accession,run_accession`
- `format=json`
- `limit=0`

Requests are split into batches of 40 experiment accessions to avoid excessively long URLs. Change `BATCH_SIZE` near the top of `app.js` if needed.

## Important behaviour

- `-` means the API returned no public run for that experiment. It can indicate an invalid accession, a private/suppressed record, no linked run, or a temporary API issue.
- One experiment can legitimately have several runs. They are returned on one line, separated by commas, so output line numbers continue to match input line numbers.
- All queries are sent directly from the visitor's browser to EMBL-EBI. There is no repository-owned backend.

## Limitations

This static implementation depends on the ENA Portal API continuing to permit cross-origin browser requests. If ENA changes its CORS policy, a small serverless proxy would be required. Do not use an unrestricted public proxy. A controlled Cloudflare Worker, Netlify Function or Vercel Function would be safer.

## Licence

MIT. See `LICENSE`.
