const solr = require('solr-client');

const solrClient = solr.createClient({
    host: process.env.SOLR_HOST || '127.0.0.1',
    port: process.env.SOLR_PORT || '8983',
    core: process.env.SOLR_CORE || 'product',
    path: process.env.SOLR_PATH || '/solr'
});

solrClient.autoCommit = true;

module.exports = solrClient;
