// ── Forbidden keyword set ──────────────────────────────────────────────────
// String-based O(1) lookup for common porn/adult/violent keywords in video titles.
// Regexes are reserved for critical CSAM patterns only.

const FORBIDDEN_WORDS = new Set([
  // ── Pornography — core terms (EN) ─────────────────────────────────────
  'porn','porno','pornographic','pornography','porntube','pornstar','pornostar',
  'pornhub','pornou','pornvideo','pornclip','pornfilm','pornmovie',
  'xxx','x-rated','xxnx','xnxx','xvideo','xvideos','xhamster','x-video',
  'sex','sexy','sexe','sexo','sext','sexting','sexvideo','sexclip',
  'sexual','sexuality','sexualcontent','sexscene','sexact','sexfilm',
  'nude','nudes','nudist','nudism','nudepic','nakedpic','nakedvideo',
  'naked','nakedness','bareass','bareskin',
  'adult','adultfilm','adultcontent','adultonly','adultmovie','adultvideo',
  'nsfw','18plus','18+','21plus','erotica','erotic','erotisch',
  'eroge','erofilm','erovideo',
  'masturbate','masturbation','masturbating','jerkoff','jerk-off',
  'orgasm','cumshot','creampie','facials','facial','squirt','squirting',
  'blowjob','handjob','footjob','rimjob','titjob','boobjob','deepthroat',
  'anal','analsex','analfuck','assplay','assfuck','asslicking','asslick',
  'pussy','cunt','cock','dick','prick','boner','hardon','erection',
  'boobs','boob','tits','titties','nipple','nipples','breasts','busty','buxom',
  'vagina','vulva','clitoris','penis','scrotum','testicles','balls','phallus',
  'intercourse','penetration','fornication','copulation','coitus',
  'prostitute','prostitution','hooker','whore','slut','bitch','milf',
  'gilf','dilf','sugar-daddy','sugardaddy','escort','callgirl','call-girl',
  'fetish','bdsm','bondage','domination','submission','sadism','masochism',
  'sado','sm-play','latex-fetish','rubber-fetish','leather-fetish',
  'gangbang','threesome','foursome','orgy','swinger','swinging',
  'cuckolding','cuckold','cheating-sex','hotwife','hotwifing',
  'exhibitionism','voyeurism','voyeur','peeping','nudecam','webcam-nude',
  'onlyfans','fansly','manyvids','clips4sale','naughtyamerica',
  'brazzers','realitykings','bangbros','mofos','nubiles','teenbff',
  'twistys','wicked','evilangel','digitalplayground','kink','kink.com',
  'redtube','youporn','spankwire','tube8','pornmd','videosz','porntrex',
  'xfantasy','xempire','hclips','beeg','tnaflix','empflix',
  'javhd','jav','av-idol','avmodel','censored','uncensored',
  'creampied','bareback','rawsex','rawfuck','unprotected',
  'amateur','amateurporn','homemade-sex','homemadesex',
  'casting','casting-couch','castingcouch',
  'leaked','leakedvideo','leakednudes','privateleak',
  'revenge-porn','revengeporn','extortion-video',
  'stripper','striptease','lapdance','lapdance','peeloff',
  'camgirl','camboy','liveshow','cybersex',

  // ── Incest / Taboo ────────────────────────────────────────────────────
  'incest','incestuous','taboo',
  'stepsister','step-sister','stepsis','step-sis',
  'stepbrother','step-brother','stepbro','step-bro',
  'stepmom','step-mom','stepmommy','step-mommy',
  'stepdad','step-dad','stepdaddy','step-daddy','stepfather',
  'stepson','step-son','stepdaughter','step-daughter',
  'halfbrother','halfsister','half-sibling',
  'family-sex','familysex','familyporn','family-porn',
  'mother-son','son-mother','father-daughter','daughter-father',
  'sibling-sex','siblinglove','forbidden-family',

  // ── Violence / Extreme content ────────────────────────────────────────
  'snuff','snufffilm','snuff-film',
  'gore','gorefilm','goreclip','gorevideo',
  'beheading','decapitation','execution-video','lynching-video',
  'torture','tortured','torturing','tortureporn',
  'mutilation','mutilated','self-harm-video','cutting-video',
  'massacre-footage','warcrimes-footage','battlefield-execution',
  'realgore','bestgore','liveleak','kaotic','sexygoregrills',
  'necrophilia','necrophiliac','snuffmovie',

  // ── Hentai / Anime adult ───────────────────────────────────────────────
  'hentai','ecchi','yaoi','yuri','doujin','doujinshi',
  'ahegao','tentacle-porn','tentacleporn','monstergirl',
  'lewd','lewdanime','r18','r-18','eroanimation',
  'netorare','ntr','femdom-anime','ryona',

  // ── Escort / Solicitation ─────────────────────────────────────────────
  'escort-service','escortad','sexworker','sex-worker',
  'gigolo','male-escort','pay-for-sex','money-for-sex',
  'redlightdistrict','red-light-district','brothel',
  'sexshop','sex-shop','adultshop','erotic-shop',

  // ── Drug / Trafficking ───────────────────────────────────────────────
  'childtrafficking','human-trafficking','trafficking-video',
  'rapefilm','rape-film','rapevideos','rape-video',
  'drugged-sex','drugged-girl','rohypnol-sex',

  // ── Russian / Uzbek / Turkish keywords ───────────────────────────────
  'порно','порнуха','порнофильм','порносайт','порноролик','порнозвезда',
  'секс','сексвидео','сексролик','сексуальный','сексуальные',
  'голая','голый','голые','обнаженная','обнаженный','раздетая','раздетый',
  'эротика','эротический','эротическое','эровидео',
  'пизда','хуй','ебать','ебёт','ебля','трахать','трахает','сосать',
  'сиськи','сися','жопа','задница','попа','анал','анальный',
  'минет','куннилингус','фелляция','оргазм','кончить','кончает',
  'мастурбация','онанизм','дрочить','шлюха','проститутка',
  'инцест','мачеха','отчим','пасынок','падчерица',
  'сводная','совратить','развратный','совращение',
  'насилие','изнасилование','принудительный-секс',
  'порнография','детская-порнография','педофилия',
  'сисяндры','титьки','пиписька','залупа',

  // Uzbek
  'jinsiy','jinsiylik','pornografiya','uyat-video','yalang\'och',
  'zo\'rlash','zo\'rlashga','qizlar-video','uyatsiz',

  // Turkish
  'porno','pornografik','seks','cinsel','cinsellik','sikiş','sikilmek',
  'am','göt','yarrak','orospu','fahişe','ensest','tecavüz',
  'kızlık','müstehcen','açık-video','erotik',

  // German
  'ficken','wichsen','nackt','erotisch','puff',
  'bordell','hure','schlampe','arschloch',

  // French
  'baiser','salope','putain','pute','baise','nue','érotique',

  // Spanish/Portuguese
  'sexo','porno','coger','follar','putita','puta','desnuda',
  'erotico','erótico','culiando','chingar',

  // ── Platform / Site names (adult) ─────────────────────────────────────
  'chaturbate','livejasmin','cam4','myfreecams','bongacams',
  'streamate','imlive','jasmin','stripchat','sexcamly',
  'xtube','kink','nubile','realitykings','badoinkvr',
  'babepedia','hotmovies','porndig','porngo','porndude',

  // ── Spam / Scam adult ─────────────────────────────────────────────────
  'free-xxx','freeporn','freesex','watchporn','watchsex',
  'hot-girl','hotgirls','sexygirls','naked-girls','nudemodels',
  'onlinestrip','live-sex','livesex','sex-live','watchlive-nude',
]);

// Multi-word forbidden phrases (checked via includes)
const FORBIDDEN_PHRASES: string[] = [
  'step sister', 'step mom', 'step dad', 'step brother', 'step son', 'step daughter',
  'half sister', 'half brother', 'family sex', 'family porn',
  'mother son sex', 'father daughter sex', 'teen porn', 'teen sex',
  'young girls', 'young sex', 'child sex', 'minor sex', 'underage sex',
  'revenge porn', 'leaked nudes', 'hidden camera sex', 'voyeur sex',
  'rape video', 'rape porn', 'forced sex', 'drugged sex',
  'real gore', 'beheading video', 'execution video', 'torture video',
  // Russian
  'сводная сестра', 'сводный брат', 'детское порно', 'детский секс',
  'молодые девушки голые', 'скрытая камера секс', 'изнасилование видео',
  'порно видео', 'секс видео', 'голые девушки', 'голые женщины',
  // Uzbek
  'jinsiy zo\'rlash', 'yalang\'och qiz',
];

// Critical CSAM regexes — never allowed, results in immediate ban
const CSAM_PATTERNS: RegExp[] = [
  /\bloli\b/i, /\bshota\b/i, /\bchild.?porn/i, /\bcp\b(?:\.com|vid|pic)?/i,
  /детское\s+порно/i, /педофили/i, /child\s+sex/i, /underage\s+sex/i,
  /\bpreteen\b/i, /\bpre-teen\b/i, /\bpthc\b/i, /\bkidporn\b/i,
];

export interface FilterResult {
  isSuspicious: boolean;
  reason: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchedWord?: string;
}

export function checkContent(text: string): FilterResult {
  if (!text) return { isSuspicious: false, reason: null, severity: 'low' };

  const normalized = text.toLowerCase();

  // 1. CSAM — critical, immediate
  for (const pattern of CSAM_PATTERNS) {
    if (pattern.test(normalized)) {
      return { isSuspicious: true, reason: 'CSAM content detected', severity: 'critical', matchedWord: pattern.source };
    }
  }

  // 2. Multi-word phrases
  for (const phrase of FORBIDDEN_PHRASES) {
    if (normalized.includes(phrase)) {
      const isHighSeverity = /sex|porn|rape|gore|child|underage|порно|секс|насилие|изнасилование/.test(phrase);
      return {
        isSuspicious: true,
        reason: `Suspicious phrase: "${phrase}"`,
        severity: isHighSeverity ? 'high' : 'medium',
        matchedWord: phrase,
      };
    }
  }

  // 3. Word-by-word keyword lookup (split on non-alphanumeric except hyphen)
  const words = normalized.match(/[a-zA-Zа-яёА-ЯЁ0-9-]+/g) ?? [];
  for (const word of words) {
    const clean = word.replace(/-/g, '');
    if (FORBIDDEN_WORDS.has(word) || FORBIDDEN_WORDS.has(clean)) {
      const highSeverityWords = /porn|sex|fuck|rape|gore|snuff|hentai|порно|секс|ебать|трахать|насилие/;
      const isHigh = highSeverityWords.test(word);
      return {
        isSuspicious: true,
        reason: `Suspicious word: "${word}"`,
        severity: isHigh ? 'high' : 'medium',
        matchedWord: word,
      };
    }
  }

  return { isSuspicious: false, reason: null, severity: 'low' };
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
