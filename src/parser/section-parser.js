// src/parser/section-parser.js
export function extractSections (doc) {
  const body = doc.document?.body;
  if (!body) return [{}];

  const sectPrList = [].concat(body.sectPr || []);
  return sectPrList.map(sect => ({
    margins: {
      top: sect.pgMar?.['@_top'],
      bottom: sect.pgMar?.['@_bottom'],
      left: sect.pgMar?.['@_left'],
      right: sect.pgMar?.['@_right'],
      header: sect.pgMar?.['@_header'],
      footer: sect.pgMar?.['@_footer'],
    },
    pageSize: {
      width: sect.pgSz?.['@_w'],
      height: sect.pgSz?.['@_h'],
      orient: sect.pgSz?.['@_orient'] || 'portrait',
    },
  }));
}