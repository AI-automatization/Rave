import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { logger } from '@shared/utils/logger';

const MOVIE_INDEX = 'movies';

/**
 * Elasticsearch `movies` index mapping va custom analyzer yaratish.
 * Server startup da bir marta chaqiriladi.
 */
export async function initElasticsearchIndex(elastic: ElasticsearchClient): Promise<void> {
  try {
    const indexExists = await elastic.indices.exists({ index: MOVIE_INDEX });

    if (indexExists) {
      logger.info('Elasticsearch index already exists', { index: MOVIE_INDEX });
      return;
    }

    await elastic.indices.create({
      index: MOVIE_INDEX,
      settings: {
        analysis: {
          // ────────────────────────────────────────────
          // Char filters — apostrophe, special chars tozalash
          // ────────────────────────────────────────────
          char_filter: {
            apostrophe_filter: {
              type: 'mapping',
              mappings: ["' => '", "' => '", '" => "', '" => "'],
            },
          },
          // ────────────────────────────────────────────
          // Tokenizers
          // ────────────────────────────────────────────
          tokenizer: {
            // Uzbek va Russian matnlar uchun n-gram (partial search)
            edge_ngram_tokenizer: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 10,
              token_chars: ['letter', 'digit'],
            },
          },
          // ────────────────────────────────────────────
          // Analyzers
          // ────────────────────────────────────────────
          analyzer: {
            // Default search analyzer — lowercase + stopwords
            cinesync_standard: {
              type: 'custom',
              char_filter: ['apostrophe_filter', 'html_strip'],
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding', 'trim'],
            },
            // Partial search — prefix matching (edge n-gram)
            cinesync_autocomplete: {
              type: 'custom',
              char_filter: ['apostrophe_filter'],
              tokenizer: 'edge_ngram_tokenizer',
              filter: ['lowercase', 'asciifolding'],
            },
            // Search query analyzer (faqat tokenize + lowercase)
            cinesync_search: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
            // Russian text analyzer (built-in stemmer)
            cinesync_russian: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'russian_stop', 'russian_stemmer'],
            },
          },
          // ────────────────────────────────────────────
          // Token filters
          // ────────────────────────────────────────────
          filter: {
            russian_stop: {
              type: 'stop',
              stopwords: '_russian_',
            },
            russian_stemmer: {
              type: 'stemmer',
              language: 'russian',
            },
          },
        },
        // Performance settings
        number_of_shards: 1,
        number_of_replicas: 0, // Dev uchun 0, production da 1
        max_result_window: 10000,
      },
      mappings: {
        properties: {
          // ── Searchable fields ──────────────────────
          title: {
            type: 'text',
            analyzer: 'cinesync_autocomplete',
            search_analyzer: 'cinesync_search',
            boost: 3,
            fields: {
              keyword: { type: 'keyword' },
              standard: { type: 'text', analyzer: 'cinesync_standard' },
              russian: { type: 'text', analyzer: 'cinesync_russian' },
            },
          },
          originalTitle: {
            type: 'text',
            analyzer: 'cinesync_autocomplete',
            search_analyzer: 'cinesync_search',
            boost: 2,
            fields: {
              keyword: { type: 'keyword' },
            },
          },
          description: {
            type: 'text',
            analyzer: 'cinesync_standard',
            fields: {
              russian: { type: 'text', analyzer: 'cinesync_russian' },
            },
          },
          // ── Filter/Aggregation fields ──────────────
          genre: {
            type: 'keyword',
          },
          type: {
            type: 'keyword',
          },
          year: {
            type: 'integer',
          },
          rating: {
            type: 'float',
          },
          viewCount: {
            type: 'long',
          },
          isPublished: {
            type: 'boolean',
          },
          addedBy: {
            type: 'keyword',
          },
          // ── Date fields ────────────────────────────
          createdAt: {
            type: 'date',
          },
        },
      },
    });

    logger.info('Elasticsearch index created', { index: MOVIE_INDEX });
  } catch (error) {
    logger.error('Failed to initialize Elasticsearch index', { error: (error as Error).message });
    // Index xatosi servisni to'xtatmasligi kerak — warn log yetarli
  }
}
