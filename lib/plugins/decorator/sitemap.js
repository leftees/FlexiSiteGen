'use strict';

function init({
    processorConfig,
    processorGlobalConfig,
    globalConfig,
}) {
  const config = Object.assign({}, globalConfig, processorGlobalConfig, processorConfig);

  function templateVariables(sitemap, fns, db) {
    const templateVariables = db.get('templateVariables');
    return config.createMapFor
      .map((type) => templateVariables[type].map((content) => {
        const contentSiteMapConfig = content.meta.sitemap || {};
        return {
          url: content.meta.url,
          changeFrequency: contentSiteMapConfig.changeFrequency,
          priority: contentSiteMapConfig.priority,
          lastModified: contentSiteMapConfig.lastModified,
        };
      }))
      .reduce((arr, cur) => [...arr, ...cur], []);
  }

  function createEntry(domain, { url, changeFrequency = '', priority = '', lastModified = '' }) {
    return `
    <url>
      <loc>${domain}/${url}</loc>
      <lastmod>${lastModified}</lastmod>
      <changefreq>${changeFrequency}</changefreq>
      <priority>${priority}</priority>
    </url>`;
  }

  function createSitemap(domain, entries) {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${entries.map((entry) => createEntry(domain, entry)).join('\n')}
      </urlset>
    `;
  }

  function process(sitemapWithLocals, helperFns, db) {
    const next = {};
    const domain = config.domain;

    next.writePath = 'sitemap';
    next.contentsToWrite = createSitemap(domain, db.get('templateVariables').sitemap);
    return next;
  }

  function postprocess(sitemap) {
    if (config.productionMode) {
      sitemap.contentsToWrite = sitemap.contentsToWrite
          .replace(/<.*><\/.*>/g, '') // remove empty tags (must be first!)
          .replace(/\n/g, '') // remove newline
          .replace(/\s\s+/g, ''); // remove empty space
      return sitemap;
    }
    sitemap.contentsToWrite = sitemap.contentsToWrite.replace(/<.*><\/.*>/g, '');
    return sitemap;
  }

  function write(sitemap, { writers }) {
    writers.file(`${config.outputDir}/${sitemap.writePath}.xml`, sitemap.contentsToWrite);
  }

  return {
    templateVariables,
    process,
    postprocess,
    write,
  };
}

const type = 'decorator';
const name = 'sitemap';
function registration(register) {
  register(type, name, init);
}
module.exports = registration;
