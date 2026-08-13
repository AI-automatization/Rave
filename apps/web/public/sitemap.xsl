<?xml version="1.0" encoding="UTF-8"?>
<!--
  Human-readable rendering of /sitemap.xml.

  Referenced from the sitemap through an <?xml-stylesheet?> processing instruction.
  Crawlers ignore that instruction and read the raw XML; browsers apply this transform,
  which is the only reason the file is legible at all — a sitemap carrying <xhtml:link>
  hreflang nodes falls out of Chrome's XML tree viewer and renders as one wall of text.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>WeWatch — карта сайта</title>
        <style>
          :root {
            color-scheme: dark;
            --bg: #09090b;
            --panel: #111114;
            --border: #26262b;
            --text: #f4f4f5;
            --muted: #8b8b93;
            --accent: #7B72F8;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 40px 24px 80px;
            background: var(--bg);
            color: var(--text);
            font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .wrap { max-width: 1180px; margin: 0 auto; }
          h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -0.02em; }
          .sub { color: var(--muted); font-size: 14px; margin: 0 0 28px; }
          .sub a { color: var(--accent); text-decoration: none; }
          .sub a:hover { text-decoration: underline; }
          .count {
            display: inline-block;
            padding: 2px 10px;
            margin-left: 8px;
            border-radius: 999px;
            background: rgba(123, 114, 248, 0.14);
            border: 1px solid rgba(123, 114, 248, 0.35);
            color: var(--accent);
            font-size: 13px;
            font-weight: 600;
          }
          .panel {
            border: 1px solid var(--border);
            border-radius: 14px;
            background: var(--panel);
            overflow: hidden;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td {
            padding: 11px 16px;
            text-align: left;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
          }
          th {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
            font-weight: 600;
            background: rgba(255, 255, 255, 0.02);
          }
          tr:last-child td { border-bottom: 0; }
          tr:hover td { background: rgba(255, 255, 255, 0.03); }
          td.num { color: var(--muted); font-variant-numeric: tabular-nums; width: 48px; }
          a.loc { color: var(--text); text-decoration: none; word-break: break-all; }
          a.loc:hover { color: var(--accent); text-decoration: underline; }
          .lang {
            display: inline-block;
            margin: 0 4px 3px 0;
            padding: 1px 7px;
            border-radius: 5px;
            border: 1px solid var(--border);
            color: var(--muted);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          td.meta { color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
          td.prio { font-variant-numeric: tabular-nums; }
          @media (max-width: 720px) {
            body { padding: 24px 12px 56px; }
            th.hide, td.hide { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>
            Карта сайта WeWatch
            <span class="count"><xsl:value-of select="count(sitemap:urlset/sitemap:url)" /> страниц</span>
          </h1>
          <p class="sub">
            Это XML-файл для поисковых систем, показанный в читаемом виде.
            Подробнее о формате — <a href="https://www.sitemaps.org/protocol.html">sitemaps.org</a>.
          </p>

          <div class="panel">
            <table>
              <tr>
                <th class="num">#</th>
                <th>Адрес</th>
                <th class="hide">Языковые версии</th>
                <th class="hide">Изменено</th>
                <th class="hide">Частота</th>
                <th>Приоритет</th>
              </tr>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td class="num"><xsl:value-of select="position()" /></td>
                  <td>
                    <a class="loc" href="{sitemap:loc}"><xsl:value-of select="sitemap:loc" /></a>
                  </td>
                  <td class="hide">
                    <xsl:for-each select="xhtml:link[@rel='alternate']">
                      <span class="lang"><xsl:value-of select="@hreflang" /></span>
                    </xsl:for-each>
                  </td>
                  <td class="meta hide"><xsl:value-of select="sitemap:lastmod" /></td>
                  <td class="meta hide"><xsl:value-of select="sitemap:changefreq" /></td>
                  <td class="prio"><xsl:value-of select="sitemap:priority" /></td>
                </tr>
              </xsl:for-each>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
