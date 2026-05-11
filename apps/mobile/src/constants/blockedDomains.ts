const BLOCKED_DOMAINS = new Set([
  // Top adult platforms
  'pornhub.com', 'pornhub.net', 'pornhub.org',
  'xvideos.com', 'xvideos2.com', 'xvideos3.com',
  'xnxx.com', 'xnxx-cdn.com',
  'xhamster.com', 'xhamster2.com', 'xhamster3.com',
  'xhamster.desi', 'xhamster.one',
  'redtube.com', 'redtube.com.br',
  'youporn.com', 'tube8.com',
  'spankbang.com', 'spankbang.party',
  'beeg.com', 'beeg.porn', 'beeg.x',
  'eporner.com', 'empflix.com',
  'drtuber.com', 'tnaflix.com',
  'nuvid.com', 'vporn.com',
  'fuq.com', 'hclips.com',
  'txxx.com', 'tubegalore.com',
  'sunporno.com', 'pornhd.com',
  'pornotube.com', 'pinkrod.com',
  'lobstertube.com', 'keezmovies.com',
  'veporns.com', 'xcafe.com',
  'xcalifornication.com', 'xbabe.com',
  'xxxbunker.com', 'x-art.com',
  'heavy-r.com', 'motherless.com',
  'brazzers.com', 'realitykings.com',
  'bang.com', 'babes.com',
  'mofos.com', 'twistys.com',
  'wicked.com', 'digitalplayground.com',
  'vivid.com', 'elegantangel.com',
  'naughtyamerica.com', 'adulttime.com',
  'archangelvideo.com', 'girlfriendsfilms.com',

  // Tube aggregators
  'xfantasy.tv', 'xtapes.to', 'xtube.com',
  'porngo.tv', 'pornlib.com', 'pornsok.com',
  'porndr.com', 'tubepornclassic.com',
  'proporn.com', 'pornone.com',
  'porcore.com', 'porn.com',
  'porn300.com', 'porn555.com',
  'fapnado.com', 'fapello.com',
  'faphouse.com', 'fapster.xxx',
  'fapvid.com', 'fapmansion.com',
  'vidhd.com', 'videopornone.com',
  'vidlox.me', 'vidoza.net',
  'megatube.xxx', 'megaporn.com',
  'megasesso.com', 'sexvid.xxx',
  'sexvideo.com', 'sex.com',
  'sextu.be', 'sexyvideos.xxx',
  'sexyteensporn.com', 'sexuria.com',
  'free-porn.info', 'free-xxx-porn.com',
  'freeporn.com', 'freepornvs.com',
  'freeadultvideos.com', 'freeones.com',

  // Amateur / cam / fan
  'onlyfans.com', 'fansly.com',
  'manyvids.com', 'clips4sale.com',
  'chatturbate.com', 'chaturbate.com',
  'livejasmin.com', 'myfreecams.com',
  'cam4.com', 'stripchat.com',
  'bongacams.com', 'streamate.com',
  'imlive.com', 'jasmin.com',
  'camsloveaholics.com', 'camsoda.com',
  'amateur.tv', 'amateurporn.com',
  'slutload.com', 'slutroulette.com',

  // xxx TLD variants
  'xxx.com', 'video.xxx', 'sex.xxx',
  'ok.xxx', 'tube.xxx', 'live.xxx',

  // Image boards & misc
  'rule34.xxx', 'rule34.paheal.net',
  'hentai.name', 'hentaihaven.xxx',
  'nhentai.net', 'hentaidude.xxx',
  'gelbooru.com', 'danbooru.donmai.us',
  'e621.net', 'furaffinity.net',

  // CIS / regional adult
  'ebalka.com', 'erotube.ru',
  'pornolab.net', 'runetki.com',
  'russkoe-porno.com', 'xxxrus.net',
  'sexpics.ru', 'kinky.ru',
  'brazzers.ru', 'pornuxa.com',
  'porno.ru', 'sexrf.ru',
  'erot.co', 'ero.ru',

  // Adult dating / escort
  'adultfriendfinder.com', 'benaughty.com',
  'ashley-madison.com', 'ashleymadison.com',
  'alt.com', 'swinglifestyle.com',
  'fetlife.com',
]);

// T-E111: dynamic list check — populated by useDynamicBlockedDomains hook at app startup
import { isDynamicDomainBlocked } from '@hooks/useDynamicBlockedDomains';

export function isDomainBlocked(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (BLOCKED_DOMAINS.has(hostname)) return true;
    const parts = hostname.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      if (BLOCKED_DOMAINS.has(parts.slice(i).join('.'))) return true;
    }
    return isDynamicDomainBlocked(hostname);
  } catch {
    return false;
  }
}
