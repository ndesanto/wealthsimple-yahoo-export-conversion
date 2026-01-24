import {convertWealthsimpleToYahoo} from './calculation.js';

(function(){
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const tableWrap = document.getElementById('tableWrap');
  const tableWrapOutput = document.getElementById('tableWrapOutput');
  const csvCopy = document.getElementById('csvCopy');
  const message = document.getElementById('message');
  const clearBtn = document.getElementById('clearBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const processBtn = document.getElementById('processBtn');
  const csvInput = document.getElementById('csvInput');
  let resultParsedData = null;
  if (processBtn) processBtn.addEventListener('click', () => {
    const inputText = csvInput.value;
    if (!inputText) {
      message.textContent = 'Please provide CSV input.';
      return;
    }
    try {
      const data = parseCSV(inputText);
      resultParsedData = convertWealthsimpleToYahoo(data);
      csvCopy.textContent = resultParsedData;
      renderTable(data);
      if (downloadBtn) downloadBtn.disabled = false;
      renderTable(resultParsedData.split('\n').map(r => r.split(',')), tableWrapOutput);

      message.textContent = `Processed ${data.length} rows.`;
    } catch (err) {
      message.textContent = 'Error processing CSV: ' + err.message;
    }
  });
  

  fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files.length) readFile(e.target.files[0]);
  });

  if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());

  // Drag & drop
  ['dragenter','dragover','dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, preventDefaults));
  function preventDefaults(e){ e.preventDefault(); e.stopPropagation(); }

  dropZone.addEventListener('drop', e => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) readFile(dt.files[0]);
  });

  // clicking the drop zone opens file chooser as well
  dropZone.addEventListener('click', () => fileInput.click());

  clearBtn.addEventListener('click', () => {
    tableWrap.innerHTML = '';
    tableWrapOutput.innerHTML = '';
    csvInput.value = '';
    csvCopy.textContent = '';
    message.textContent = '';
    fileInput.value = '';
    resultParsedData = null;
    if (downloadBtn) downloadBtn.disabled = true;
  });

  function readFile(file){
    if (!file) return;
    if (!file.name.match(/\.csv$/i) && file.type.indexOf('text')===-1){
      message.textContent = 'Please provide a CSV file.';
      return;
    }
    message.textContent = `Reading ${file.name}...`;
    const fr = new FileReader();
    fr.onload = () => {
      try{
        const text = fr.result;
        const data = parseCSV(text);
        resultParsedData = convertWealthsimpleToYahoo(data);
        if (downloadBtn) downloadBtn.disabled = false;

        csvCopy.textContent = resultParsedData;
        renderTable(data);
        renderTable(resultParsedData.split('\n').map(r => r.split(',')), tableWrapOutput);

        message.textContent = `Loaded ${data.length} rows.`;

      }catch(err){
        message.textContent = 'Error parsing CSV: ' + err.message;
      }
    };
    fr.onerror = ()=> message.textContent = 'Error reading file.';
    fr.readAsText(file);
  }

  if (downloadBtn) downloadBtn.addEventListener('click', () => {
    if (!resultParsedData) {
      message.textContent = 'No result available to download.';
      return;
    }

    const csv = resultParsedData;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ws-yahoo-export-conversion-result.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  function arrayToCSV(data){
    if (!data || !data.length) return '';
    function escapeField(val){
      if (val === null || val === undefined) return '';
      let s = String(val);
      if (s.indexOf('"') !== -1) s = s.replace(/"/g, '""');
      if (s.indexOf(',') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1 || s.indexOf('"') !== -1) {
        return '"' + s + '"';
      }
      return s;
    }

    // Array of arrays
    if (Array.isArray(data[0])){
      return data.map(row => row.map(escapeField).join(',')).join('\r\n');
    }

    // Array of objects: use union of keys from first item
    if (typeof data[0] === 'object'){
      const headers = Object.keys(data[0]);
      const headerLine = headers.map(escapeField).join(',');
      const rows = data.map(obj => headers.map(h => escapeField(obj[h])).join(','));
      return [headerLine].concat(rows).join('\r\n');
    }

    // Fallback: one-column
    return data.map(r => escapeField(r)).join('\r\n');
  }

  // Simple CSV parser supporting quoted fields and newlines inside quotes
  function parseCSV(text, delimiter = ','){
    const rows = [];
    let cur = '';
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++){
      const ch = text[i];
      const next = text[i+1];

      if (ch === '"'){
        if (inQuotes && next === '"'){
          cur += '"'; // escaped quote
          i++; // skip next
        }else{
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === delimiter && !inQuotes){
        row.push(cur);
        cur = '';
        continue;
      }

      if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuotes){
        // handle CRLF or LF
        if (ch === '\r' && next === '\n') i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
        continue;
      }

      cur += ch;
    }
    // last field
    if (cur !== '' || inQuotes || row.length){
      row.push(cur);
      rows.push(row);
    }
    // trim possible trailing empty final row
    if (rows.length>0 && rows[rows.length-1].length===1 && rows[rows.length-1][0]==='') rows.pop();
    return rows;
  }

  function renderTable(data, tableWrapElement = tableWrap){
    tableWrapElement.innerHTML = '';
    if (!data || !data.length) return;
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const header = data[0];
    const headerRow = document.createElement('tr');
    header.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    for (let r = 1; r < data.length; r++){
      const tr = document.createElement('tr');
      const row = data[r];
      for (let c = 0; c < header.length; c++){
        const td = document.createElement('td');
        if (row[c] === undefined || row[c] == "" || row[c].includes("As of")) continue;
        td.textContent = row[c] !== undefined ? row[c] : '';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrapElement.appendChild(table);
  }
})();


