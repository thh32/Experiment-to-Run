# ENA Experiment to Run Converter

A GitHub Page that converts NCBI/ENA experiment accessions, such as `ERX8831546`, to their associated run accessions, such as `ERR9289904`.

The site uses the official ENA Portal API.

https://thh32.github.io/Experiment-to-Run/


## Features

- accepts one `ERX`, `SRX` or `DRX` experiment accession per line
- preserves input order and duplicate entries
- returns multiple run accessions as a comma-separated value
- inserts `-` when no public run is returned
- copies results to the clipboard
- downloads experiment-to-run mappings as TSV
- works as a static GitHub Pages site, with no server or build step

