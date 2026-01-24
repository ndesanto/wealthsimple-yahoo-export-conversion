CSV Importer
=============

Simple static webpage that lets you import a CSV file and view it as a table.

Usage
-----

- Open `index.html` in a browser, or run a local server from the project folder:

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

- Click the "Choose CSV" button or drag & drop a CSV into the drop zone.
- The first row is treated as a header row and used as table headings.

Notes
-----
- The included parser handles quoted fields and escaped quotes (`""`).
- For large CSVs or advanced parsing features, consider using an existing parser like PapaParse.
