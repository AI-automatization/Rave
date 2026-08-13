import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';
import uzMessages from '../../messages/uz.json';

type Locale = 'ru' | 'uz' | 'en';
type JsonObject = Record<string, unknown>;

const messages = { ru: ruMessages, uz: uzMessages, en: enMessages } as const;

export function publishHomepageSchema(schema: JsonObject, locale: Locale): JsonObject {
  const graph = Array.isArray(schema['@graph']) ? (schema['@graph'] as JsonObject[]) : [];
  const faqItems = messages[locale].landing.faqItems;

  return {
    ...schema,
    '@graph': graph
      .filter((node) => node['@type'] !== 'HowTo')
      .map((node) => {
        if (node['@type'] === 'FAQPage') {
          return {
            ...node,
            mainEntity: faqItems.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          };
        }
        return node;
      }),
  };
}
