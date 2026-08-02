export const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const reportDocument = (title, body) => `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body{max-width:1100px;margin:0 auto;padding:32px;font:15px/1.55 system-ui,sans-serif;color:#202326;background:#f2f2ef}
h1,h2{font-family:Georgia,serif}table{width:100%;border-collapse:collapse;background:#fff}
th,td{padding:8px;border:1px solid #bbb;text-align:left;vertical-align:top}
code{background:#e4e4df;padding:2px 4px}.warning{border-left:5px solid #9b6b18;padding:10px;background:#fff7dc}
@media print{body{background:#fff;padding:0}.warning{break-inside:avoid}}
</style>
</head>
<body>${body}</body>
</html>`;

