/**
 * Study Quran Karakter Hatası Düzeltme Script'i
 *
 * Sorun: 'c' harfi eksik, kelimeler birleşmiş
 * Çözüm: Hibrit yaklaşım (pattern + sözlük)
 */

const fs = require('fs');
const path = require('path');

// ============================================
// 1. PATTERN-BASED DÜZELTMELER
// ============================================

const PATTERN_FIXES = [
  // Yaygın kelime düzeltmeleri (c eksik)
  [/\bQurani\b/g, 'Quranic'],
  [/\bIslami\b/g, 'Islamic'],
  [/\bArabic\b/g, 'Arabic'], // zaten doğru olanları koru
  [/\bosmi/g, 'cosmic'],
  [/\bspeifi/g, 'specifi'],
  [/\bpubli\b/g, 'public'],
  [/\bmusi\b/g, 'music'],
  [/\blogi\b/g, 'logic'],
  [/\bmagi\b/g, 'magic'],
  [/\btragi\b/g, 'tragic'],
  [/\bbasi\b/g, 'basic'],
  [/\bethni\b/g, 'ethnic'],

  // "c" ile başlayan kelimeler (önceki kelimeyle birleşmiş)
  [/\bisonsidered\b/g, 'is considered'],
  [/\bislosest\b/g, 'is closest'],
  [/\bisalled\b/g, 'is called'],
  [/\bisonneced\b/g, 'is connected'],
  [/\bisondemned\b/g, 'is condemned'],
  [/\bisommonly\b/g, 'is commonly'],
  [/\bisontained\b/g, 'is contained'],
  [/\bisonfirmed\b/g, 'is confirmed'],
  [/\bisoncerned\b/g, 'is concerned'],
  [/\bisorrect\b/g, 'is correct'],

  [/\balose\b/g, 'a close'],
  [/\baommon\b/g, 'a common'],
  [/\baertain\b/g, 'a certain'],
  [/\baompanion\b/g, 'a companion'],
  [/\baousin\b/g, 'a cousin'],
  [/\baommand\b/g, 'a command'],
  [/\baomplete\b/g, 'a complete'],
  [/\baommentary\b/g, 'a commentary'],
  [/\baomment\b/g, 'a comment'],
  [/\baosmological\b/g, 'a cosmological'],

  [/\btheommentary\b/g, 'the commentary'],
  [/\btheommentator\b/g, 'the commentator'],
  [/\btheommunity\b/g, 'the community'],
  [/\btheommand\b/g, 'the command'],
  [/\btheontext\b/g, 'the context'],
  [/\btheoncept\b/g, 'the concept'],
  [/\btheondition\b/g, 'the condition'],
  [/\btheonsequence\b/g, 'the consequence'],
  [/\btheontrast\b/g, 'the contrast'],
  [/\btheontrary\b/g, 'the contrary'],
  [/\bthereated\b/g, 'the created'],
  [/\bthereation\b/g, 'the creation'],
  [/\bthereator\b/g, 'the creator'],
  [/\bthereature\b/g, 'the creature'],

  [/\btoonsecrate\b/g, 'to consecrate'],
  [/\btoontemplate\b/g, 'to contemplate'],
  [/\btoontrol\b/g, 'to control'],
  [/\btoontinue\b/g, 'to continue'],
  [/\btoonvey\b/g, 'to convey'],
  [/\btoonvert\b/g, 'to convert'],
  [/\btoonvince\b/g, 'to convince'],
  [/\btoome\b/g, 'to come'],
  [/\btoommand\b/g, 'to command'],
  [/\btoomplete\b/g, 'to complete'],
  [/\btoomprehend\b/g, 'to comprehend'],
  [/\btoonfirm\b/g, 'to confirm'],
  [/\btoonsider\b/g, 'to consider'],
  [/\btoontend\b/g, 'to contend'],
  [/\btoreate\b/g, 'to create'],

  [/\bofommand\b/g, 'of command'],
  [/\bofreation\b/g, 'of creation'],
  [/\bofreatures\b/g, 'of creatures'],

  [/\bthatannot\b/g, 'that cannot'],
  [/\bthatould\b/g, 'that could'],
  [/\bthatomes\b/g, 'that comes'],
  [/\bthatontains\b/g, 'that contains'],

  [/\bwhihhannot\b/g, 'which cannot'],
  [/\bwhihould\b/g, 'which could'],
  [/\bwhihomes\b/g, 'which comes'],
  [/\bwhihontains\b/g, 'which contains'],

  // "could/would/should" düzeltmeleri
  [/\bould\b/g, 'could'],
  [/\bwould\b/g, 'would'], // zaten doğru
  [/\bshould\b/g, 'should'], // zaten doğru

  // Yaygın birleşik kelimeler
  [/\bonneted\b/g, 'connected'],
  [/\bonnetion\b/g, 'connection'],
  [/\bonept\b/g, 'concept'],
  [/\bondition\b/g, 'condition'],
  [/\bonsequene\b/g, 'consequence'],
  [/\bonsidered\b/g, 'considered'],
  [/\bonsider\b/g, 'consider'],
  [/\bonstitute\b/g, 'constitute'],
  [/\bontain\b/g, 'contain'],
  [/\bontinue\b/g, 'continue'],
  [/\bontrary\b/g, 'contrary'],
  [/\bontrast\b/g, 'contrast'],
  [/\bontrol\b/g, 'control'],
  [/\bonvey\b/g, 'convey'],
  [/\bommanded\b/g, 'commanded'],
  [/\bommand\b/g, 'command'],
  [/\bommened\b/g, 'commenced'],
  [/\bomment\b/g, 'comment'],
  [/\bommunity\b/g, 'community'],
  [/\bompanion\b/g, 'companion'],
  [/\bompare\b/g, 'compare'],
  [/\bompassion\b/g, 'compassion'],
  [/\bomplete\b/g, 'complete'],
  [/\bomprehen\b/g, 'comprehen'],
  [/\bomprises\b/g, 'comprises'],
  [/\bondemn\b/g, 'condemn'],
  [/\bonfirm\b/g, 'confirm'],
  [/\bonserate\b/g, 'consecrate'],
  [/\breated\b/g, 'created'],
  [/\breation\b/g, 'creation'],
  [/\breator\b/g, 'creator'],
  [/\breature\b/g, 'creature'],

  // Tek 'c' eksik kelimeler - DİKKAT: 'all' kelimesine dokunma!
  [/\bannot\b/g, 'cannot'],
  [/\b([Aa])aller\b/g, '$1 caller'],  // aaller -> a caller
  [/\b([Tt])healler\b/g, '$1he caller'],  // thealler -> the caller
  [/\balls out\b/g, 'calls out'],
  [/\balls upon\b/g, 'calls upon'],
  [/\balleth\b/g, 'calleth'],
  [/\balled\b/gi, 'called'],
  // all kelimesini KORUYORUZ - call'a dönüştürmüyoruz!
  [/\bame\b/g, 'came'],
  [/\bast\b/g, 'cast'],
  [/\benter\b/g, 'center'],
  [/\bentral\b/g, 'central'],
  [/\bentury\b/g, 'century'],
  [/\bertain\b/g, 'certain'],
  [/\bhange\b/g, 'change'],
  [/\bharater\b/g, 'character'],
  [/\bhosen\b/g, 'chosen'],
  [/\bhrist\b/g, 'Christ'],
  [/\bhristian\b/g, 'Christian'],
  [/\birumstane\b/g, 'circumstance'],
  [/\blaim\b/g, 'claim'],
  [/\blear\b/g, 'clear'],
  [/\blose\b/g, 'close'],
  [/\boming\b/g, 'coming'],
  [/\bourse\b/g, 'course'],
  [/\bross\b/g, 'cross'],
  [/\burtain\b/g, 'curtain'],
  [/\butoff\b/g, 'cut off'],
  [/\bbeut\b/g, 'be cut'],

  // Özel akademik/dini terimler
  [/\bommentator\b/g, 'commentator'],
  [/\bommentators\b/g, 'commentators'],
  [/\bommentaries\b/g, 'commentaries'],
  [/\bosmology\b/g, 'cosmology'],
  [/\bosmi\b/g, 'cosmic'],
  [/\bosmologial\b/g, 'cosmological'],
  [/\baliph\b/g, 'Caliph'],
  [/\baliphs\b/g, 'Caliphs'],
  [/\blass\b/g, 'class'],
  [/\blergy\b/g, 'clergy'],

  // Büyük harfle başlayanlar
  [/\bChristians\b/g, 'Christians'],
  [/\bompanions\b/g, 'Companions'],
  [/\bompanion\b/g, 'Companion'],

  // Apostrophe ile bitenler (Islami' -> Islamic)
  [/Islami'/g, 'Islamic'],
  [/Qurani'/g, 'Quranic'],
  [/Arabi'/g, 'Arabic'],

  // Ek düzeltmeler - birleşik kelimeler
  [/\bitonnotes\b/g, 'it connotes'],
  [/\bitomes\b/g, 'it comes'],
  [/\bitould\b/g, 'it could'],
  [/\bitannot\b/g, 'it cannot'],
  [/\bitan\b/g, 'it can'],

  [/\bonveys\b/g, 'conveys'],
  [/\bonserate\b/g, 'consecrate'],
  [/\bonserates\b/g, 'consecrates'],
  [/\bonseration\b/g, 'consecration'],
  [/\bonnotes\b/g, 'connotes'],
  [/\bonnote\b/g, 'connote'],
  [/\bonnetion\b/g, 'connection'],
  [/\bonnetions\b/g, 'connections'],
  [/\bontrary\b/g, 'contrary'],
  [/\bontrast\b/g, 'contrast'],
  [/\bontrol\b/g, 'control'],
  [/\bontains\b/g, 'contains'],
  [/\bontain\b/g, 'contain'],
  [/\bontinue\b/g, 'continue'],
  [/\bontinued\b/g, 'continued'],
  [/\bontinues\b/g, 'continues'],
  [/\bontext\b/g, 'context'],
  [/\bontexts\b/g, 'contexts'],
  [/\bontent\b/g, 'content'],
  [/\bontents\b/g, 'contents'],
  [/\bontend\b/g, 'contend'],
  [/\bontends\b/g, 'contends'],
  [/\bontrat\b/g, 'contract'],
  [/\bonept\b/g, 'concept'],
  [/\bonepts\b/g, 'concepts'],
  [/\bondition\b/g, 'condition'],
  [/\bonditions\b/g, 'conditions'],
  [/\bonern\b/g, 'concern'],
  [/\bonerned\b/g, 'concerned'],
  [/\bonerning\b/g, 'concerning'],
  [/\bonlude\b/g, 'conclude'],
  [/\bonlusion\b/g, 'conclusion'],
  [/\bonsidered\b/g, 'considered'],
  [/\bonsider\b/g, 'consider'],
  [/\bonsideration\b/g, 'consideration'],
  [/\bonsiders\b/g, 'considers'],
  [/\bonsists\b/g, 'consists'],
  [/\bonsist\b/g, 'consist'],
  [/\bonsistent\b/g, 'consistent'],
  [/\bonstitute\b/g, 'constitute'],
  [/\bonstitutes\b/g, 'constitutes'],
  [/\bonstrut\b/g, 'construct'],
  [/\bonstrution\b/g, 'construction'],

  // "the" ile birleşenler
  [/\btheommunity\b/gi, 'the community'],
  [/\btheommunities\b/gi, 'the communities'],
  [/\btheommentary\b/gi, 'the commentary'],
  [/\btheommentator\b/gi, 'the commentator'],
  [/\btheommentators\b/gi, 'the commentators'],
  [/\btheommand\b/gi, 'the command'],
  [/\btheonept\b/gi, 'the concept'],
  [/\btheontext\b/gi, 'the context'],
  [/\btheondition\b/gi, 'the condition'],
  [/\btheonsequene\b/gi, 'the consequence'],
  [/\btheontrast\b/gi, 'the contrast'],
  [/\btheontrary\b/gi, 'the contrary'],
  [/\bthereated\b/gi, 'the created'],
  [/\bthereation\b/gi, 'the creation'],
  [/\bthereator\b/gi, 'the creator'],
  [/\bthereature\b/gi, 'the creature'],
  [/\bthereatures\b/gi, 'the creatures'],
  [/\bthealler\b/gi, 'the caller'],
  [/\btheause\b/gi, 'the cause'],
  [/\btheases\b/gi, 'the cases'],
  [/\bthease\b/gi, 'the case'],
  [/\btheenter\b/gi, 'the center'],
  [/\btheentral\b/gi, 'the central'],
  [/\btheertain\b/gi, 'the certain'],
  [/\btheertitude\b/gi, 'the certitude'],
  [/\bthehange\b/gi, 'the change'],
  [/\btheharater\b/gi, 'the character'],
  [/\bthehoie\b/gi, 'the choice'],
  [/\bthehosen\b/gi, 'the chosen'],
  [/\bthelaim\b/gi, 'the claim'],
  [/\bthelass\b/gi, 'the class'],
  [/\bthelear\b/gi, 'the clear'],
  [/\bthelose\b/gi, 'the close'],
  [/\btheloser\b/gi, 'the closer'],
  [/\bthelosest\b/gi, 'the closest'],
  [/\btheome\b/gi, 'the come'],
  [/\btheoming\b/gi, 'the coming'],
  [/\btheovenant\b/gi, 'the covenant'],

  // "a" ile birleşenler
  [/\baommunity\b/gi, 'a community'],
  [/\baommentary\b/gi, 'a commentary'],
  [/\baommon\b/gi, 'a common'],
  [/\baertain\b/gi, 'a certain'],
  [/\baompanion\b/gi, 'a companion'],
  [/\baomplete\b/gi, 'a complete'],
  [/\baonept\b/gi, 'a concept'],
  [/\baondition\b/gi, 'a condition'],
  [/\baonsequene\b/gi, 'a consequence'],
  [/\baontext\b/gi, 'a context'],
  [/\baontrary\b/gi, 'a contrary'],
  [/\baontrast\b/gi, 'a contrast'],
  [/\bareature\b/gi, 'a creature'],
  [/\balose\b/gi, 'a close'],
  [/\baloser\b/gi, 'a closer'],
  [/\baousin\b/gi, 'a cousin'],
  [/\baaller\b/gi, 'a caller'],
  [/\baause\b/gi, 'a cause'],
  [/\baase\b/gi, 'a case'],
  [/\baenter\b/gi, 'a center'],
  [/\baentral\b/gi, 'a central'],
  [/\bahange\b/gi, 'a change'],
  [/\baharater\b/gi, 'a character'],
  [/\bahoie\b/gi, 'a choice'],
  [/\balaim\b/gi, 'a claim'],
  [/\balass\b/gi, 'a class'],
  [/\balear\b/gi, 'a clear'],
  [/\baovenant\b/gi, 'a covenant'],

  // "is" ile birleşenler
  [/\bisonsidered\b/gi, 'is considered'],
  [/\bisalled\b/gi, 'is called'],
  [/\bisonneced\b/gi, 'is connected'],
  [/\bisommonly\b/gi, 'is commonly'],
  [/\bisontained\b/gi, 'is contained'],
  [/\bisonfirmed\b/gi, 'is confirmed'],
  [/\bisloser\b/gi, 'is closer'],
  [/\bislosest\b/gi, 'is closest'],
  [/\bisomplete\b/gi, 'is complete'],
  [/\bisorrect\b/gi, 'is correct'],
  [/\bisoncerned\b/gi, 'is concerned'],
  [/\bisondemned\b/gi, 'is condemned'],

  // "of" ile birleşenler
  [/\bofreation\b/gi, 'of creation'],
  [/\bofreatures\b/gi, 'of creatures'],
  [/\bofommand\b/gi, 'of command'],
  [/\bofommunity\b/gi, 'of community'],
  [/\bofourse\b/gi, 'of course'],
  [/\bofompassion\b/gi, 'of compassion'],

  // "to" ile birleşenler
  [/\btoome\b/gi, 'to come'],
  [/\btoreate\b/gi, 'to create'],
  [/\btoomplete\b/gi, 'to complete'],
  [/\btoomprehend\b/gi, 'to comprehend'],
  [/\btoonfirm\b/gi, 'to confirm'],
  [/\btoonsider\b/gi, 'to consider'],
  [/\btoontinue\b/gi, 'to continue'],
  [/\btoontrol\b/gi, 'to control'],
  [/\btoontend\b/gi, 'to contend'],
  [/\btoonvey\b/gi, 'to convey'],
  [/\btoonvert\b/gi, 'to convert'],
  [/\btoonvine\b/gi, 'to convince'],
  [/\btoonserate\b/gi, 'to consecrate'],
  [/\btoontemplate\b/gi, 'to contemplate'],

  // "for" ile birleşenler
  [/\bforontinued\b/gi, 'for continued'],
  [/\bforomplete\b/gi, 'for complete'],
  [/\bforonsideration\b/gi, 'for consideration'],

  // Diğer yaygın birleşik kelimeler
  [/\bonean\b/gi, 'one can'],
  [/\bwhihan\b/gi, 'which can'],
  [/\bwhihannot\b/gi, 'which cannot'],
  [/\bwhihould\b/gi, 'which could'],
  [/\bthatannot\b/gi, 'that cannot'],
  [/\bthatould\b/gi, 'that could'],
  [/\bthatomes\b/gi, 'that comes'],
  [/\bthatan\b/gi, 'that can'],
  [/\bandould\b/gi, 'and could'],
  [/\bandome\b/gi, 'and come'],
  [/\bandomes\b/gi, 'and comes'],
  [/\bandannot\b/gi, 'and cannot'],
  [/\bbutould\b/gi, 'but could'],
  [/\bbutannot\b/gi, 'but cannot'],
  [/\borould\b/gi, 'or could'],
  [/\borannot\b/gi, 'or cannot'],
  [/\bwhoould\b/gi, 'who could'],
  [/\bwhoannot\b/gi, 'who cannot'],
  [/\btheyannot\b/gi, 'they cannot'],
  [/\btheyould\b/gi, 'they could'],
  [/\btheyome\b/gi, 'they come'],
  [/\bweannot\b/gi, 'we cannot'],
  [/\bweould\b/gi, 'we could'],
  [/\byouannot\b/gi, 'you cannot'],
  [/\byouould\b/gi, 'you could'],

  // Özgül Kuran/İslam terimleri
  [/\bQuraniperspective\b/gi, 'Quranic perspective'],
  [/\bQuranionept\b/gi, 'Quranic concept'],
  [/\bQuranireferene\b/gi, 'Quranic reference'],
  [/\bQuranipriniple\b/gi, 'Quranic principle'],
  [/\bIslamietiquette\b/gi, 'Islamic etiquette'],
  [/\bIslamimetaphysis\b/gi, 'Islamic metaphysics'],
  [/\bIslamiommunity\b/gi, 'Islamic community'],
  [/\bSunniommentaries\b/gi, 'Sunni commentaries'],
  [/\bShiiteommentaries\b/gi, 'Shiite commentaries'],

  // Kelime sonu düzeltmeleri
  [/osmi\b/g, 'cosmic'],
  [/Qurani\b/g, 'Quranic'],
  [/Islami\b/g, 'Islamic'],
  [/Arabi\b/g, 'Arabic'],
  [/prophetimission\b/gi, 'prophetic mission'],
  [/priestlylass\b/gi, 'priestly class'],
  [/exoteriwith\b/gi, 'exoteric with'],

  // Sayı ve harf kombinasyonları
  [/\b(\d+)c\b/g, '$1c'],  // zaten doğru olanları koru

  // Ek birleşik kelime düzeltmeleri (2. tur)
  [/\bwhichan\b/gi, 'which can'],
  [/\bwhihomprises\b/gi, 'which comprises'],
  [/\bwhihould\b/gi, 'which could'],
  [/\bvariantsan\b/gi, 'variants can'],
  [/\bbeingsomes\b/gi, 'beings comes'],
  [/\bbeingsan\b/gi, 'beings can'],
  [/\bhisommunity\b/gi, 'his community'],
  [/\bhisomplete\b/gi, 'his complete'],
  [/\bIslamicommunity\b/gi, 'Islamic community'],
  [/\bIslamimetaphysics\b/gi, 'Islamic metaphysics'],
  [/\bmiddleommunity\b/gi, 'middle community'],
  [/\bofosmiexistence\b/gi, 'of cosmic existence'],
  [/\bfourommunities\b/gi, 'four communities'],
  [/\binreation\b/gi, 'in creation'],
  [/\bwhihomprises\b/gi, 'which comprises'],
  [/\bbasmalahan\b/gi, 'basmalah can'],
  [/\bthereatures\b/gi, 'the creatures'],
  [/\beachreature\b/gi, 'each creature'],
  [/\ballreation\b/gi, 'all creation'],
  [/\ballreated\b/gi, 'all created'],
  [/\btoonstitute\b/gi, 'to constitute'],
  [/\btheonstruction\b/gi, 'the construction'],
  [/\bpathan\b/gi, 'path can'],
  [/\bthusonnotes\b/gi, 'thus connotes'],
  [/\bthatombines\b/gi, 'that combines'],
  [/\bbeautifulompanions\b/gi, 'beautiful companions'],
  [/\bblessedonveys\b/gi, 'blessed conveys'],
  [/\bphrasesould\b/gi, 'phrases could'],
  [/\bhaveommenced\b/gi, 'have commenced'],
  [/\bandommence\b/gi, 'and commence'],
  [/\bQuraniusage\b/gi, 'Quranic usage'],
  [/\bspecifiof\b/gi, 'specific of'],
  [/\bthingsomes\b/gi, 'things comes'],
  [/\bitsompletion\b/gi, 'its completion'],
  [/\btheorrect\b/gi, 'the correct'],
  [/\bone'sondition\b/gi, "one's condition"],
  [/\bHisreatures\b/gi, 'His creatures'],
  [/\bverseonveys\b/gi, 'verse conveys'],
  [/\bGodan\b/gi, 'God can'],
  [/\bHehooses\b/gi, 'He chooses'],
  [/\bmarkedhange\b/gi, 'marked change'],
  [/\ballreation\b/gi, 'all creation'],
  [/\bofomplete\b/gi, 'of complete'],
  [/\btheease\b/gi, 'the case'],
  [/\btwoategories\b/gi, 'two categories'],
  [/\bthreeategories\b/gi, 'three categories'],
  [/\btogetheran\b/gi, 'together can'],
  [/\byetome\b/gi, 'yet come'],
  [/\bQuraniprinciple\b/gi, 'Quranic principle'],
  [/\bastrayan\b/gi, 'astray can'],
  [/\bhaveommitted\b/gi, 'have committed'],
  [/\bmadelear\b/gi, 'made clear'],
  [/\bbeontrary\b/gi, 'be contrary'],
  [/\bwrathan\b/gi, 'wrath can'],
  [/\bsurahan\b/gi, 'surah can'],
  [/\bthenorrespond\b/gi, 'then correspond'],
  [/\bnotonsidered\b/gi, 'not considered'],
  [/\bofommentators\b/gi, 'of commentators'],
  [/\boftenonnected\b/gi, 'often connected'],
  [/\bAngeroming\b/gi, 'Anger coming'],
  [/\binonne\b/gi, 'in conne'],
  [/\blikrooks\b/gi, 'like crooks'],
  [/\bnorookedness\b/gi, 'no crookedness'],
  [/\bwallsovered\b/gi, 'walls covered'],
  [/\bbyurtains\b/gi, 'by curtains'],
  [/\bpathalls\b/gi, 'path calls'],
  [/\bInontrast\b/gi, 'In contrast'],
  [/\bQuran,an\b/gi, 'Quran, can'],
  [/\bnoreature\b/gi, 'no creature'],
  [/\bthatrawls\b/gi, 'that crawls'],
  [/\bmustross\b/gi, 'must cross'],
  [/\blikeamels\b/gi, 'like camels'],
  [/\btorawl\b/gi, 'to crawl'],
  [/\bofferslarification\b/gi, 'offers clarification'],
  [/\bbyausing\b/gi, 'by causing'],
  [/\bItould\b/gi, 'It could'],
  [/\bwhihase\b/gi, 'which case'],
  [/\bwhichase\b/gi, 'which case'],
  [/\bthem,urses\b/gi, 'them, curses'],
  [/\bQuraniconcept\b/gi, 'Quranic concept'],
  [/\bhisaprice\b/gi, 'his caprice'],
  [/\bandertitude\b/gi, 'and certitude'],
  [/\bHisommunity\b/gi, 'His community'],
  [/\bousan\b/gi, 'ous can'],
  [/\bhelpan\b/gi, 'help can'],
  [/\busan\b/gi, 'us can'],
  [/\bdman\b/gi, 'din can'],
  [/\bDman\b/gi, 'Din can'],
  [/\balsolosely\b/gi, 'also closely'],
  [/\byouontract\b/gi, 'you contract'],
  [/\bmoreomprehensive\b/gi, 'more comprehensive'],
  [/\bnaughtoncerning\b/gi, 'naught concerning'],
  [/\bone'somplete\b/gi, "one's complete"],
  [/\bintelligenceorrectly\b/gi, 'intelligence correctly'],
  [/\bguide\s+usan\b/gi, 'guide us can'],

  // 3. tur düzeltmeler
  [/\bdegreesan\b/gi, 'degrees can'],
  [/\bbasilevel\b/gi, 'basic level'],
  [/\bbasilevels\b/gi, 'basic levels'],
  [/\bbasially\b/gi, 'basically'],
  [/\bmusiians\b/gi, 'musicians'],
  [/\bpolitiians\b/gi, 'politicians'],
  [/\bphysiians\b/gi, 'physicians'],
  [/\btehnial\b/gi, 'technical'],
  [/\btehnially\b/gi, 'technically'],
  [/\bpratial\b/gi, 'practical'],
  [/\bpratially\b/gi, 'practically'],
  [/\bvertial\b/gi, 'vertical'],
  [/\bvertially\b/gi, 'vertically'],
  [/\bidentian\b/gi, 'identical'],
  [/\bidentially\b/gi, 'identically'],
  [/\blogian\b/gi, 'logical'],
  [/\blogially\b/gi, 'logically'],
  [/\bhistorial\b/gi, 'historical'],
  [/\bhistorially\b/gi, 'historically'],
  [/\bphysial\b/gi, 'physical'],
  [/\bphysially\b/gi, 'physically'],
  [/\bspeifially\b/gi, 'specifically'],
  [/\bspeifi\b/gi, 'specific'],
  [/\blassial\b/gi, 'classical'],
  [/\blassially\b/gi, 'classically'],
  [/\britial\b/gi, 'critical'],
  [/\britially\b/gi, 'critically'],
  [/\bethnially\b/gi, 'ethnically'],
  [/\bethial\b/gi, 'ethical'],
  [/\bethially\b/gi, 'ethically'],
  [/\bpolitial\b/gi, 'political'],
  [/\bpolitially\b/gi, 'politically'],
  [/\bmystial\b/gi, 'mystical'],
  [/\bmystially\b/gi, 'mystically'],
  [/\bsymbolially\b/gi, 'symbolically'],
  [/\bsymbolial\b/gi, 'symbolical'],
  [/\bnumerial\b/gi, 'numerical'],
  [/\bnumerially\b/gi, 'numerically'],
  [/\beonomially\b/gi, 'economically'],
  [/\beonomil\b/gi, 'economical'],
  [/\bgrammatial\b/gi, 'grammatical'],
  [/\bgrammatially\b/gi, 'grammatically'],
  [/\btheologial\b/gi, 'theological'],
  [/\btheologially\b/gi, 'theologically'],
  [/\bsholars\b/gi, 'scholars'],
  [/\bsholar\b/gi, 'scholar'],
  [/\bsholarly\b/gi, 'scholarly'],
  [/\bsholastis\b/gi, 'scholastics'],
  [/\bsripture\b/gi, 'scripture'],
  [/\bsriptures\b/gi, 'scriptures'],
  [/\bsriptural\b/gi, 'scriptural'],
  [/\blevels\b/g, 'levels'],
  [/\blevelan\b/gi, 'level can'],

  // 4. tur düzeltmeler
  [/\btopisee\b/gi, 'topic see'],
  [/\bversean\b/gi, 'verse can'],
  [/\brealityonsists\b/gi, 'reality consists'],
  [/\bGodertainly\b/gi, 'God certainly'],
  [/\bgodertainly\b/gi, 'god certainly'],
  [/\bertainly\b/gi, 'certainly'],
  [/\bseeertain\b/gi, 'see certain'],
  [/\bbeertain\b/gi, 'be certain'],
  [/\bnotertain\b/gi, 'not certain'],
  [/\bisertain\b/gi, 'is certain'],
  [/\bareertain\b/gi, 'are certain'],
  [/\bwasertain\b/gi, 'was certain'],
  [/\bwereertain\b/gi, 'were certain'],
  [/\bmostertain\b/gi, 'most certain'],
  [/\bonsists\b/gi, 'consists'],
  [/\bonsist\b/gi, 'consist'],
  [/\bonsisting\b/gi, 'consisting'],
  [/\bonsisteny\b/gi, 'consistency'],
  [/\bonsistent\b/gi, 'consistent'],
  [/\bthatonsists\b/gi, 'that consists'],
  [/\bwhihonsists\b/gi, 'which consists'],
  [/\bitonsists\b/gi, 'it consists'],
  [/\bonerneth\b/gi, 'concerneth'],
  [/\bonerns\b/gi, 'concerns'],
  [/\bonern\b/gi, 'concern'],
  [/\bonerning\b/gi, 'concerning'],
  [/\bonerned\b/gi, 'concerned'],
  [/\bthisase\b/gi, 'this case'],
  [/\bthatase\b/gi, 'that case'],
  [/\beahase\b/gi, 'each case'],
  [/\beverase\b/gi, 'every case'],
  [/\bsomease\b/gi, 'some case'],
  [/\banyase\b/gi, 'any case'],
  [/\bnoase\b/gi, 'no case'],
  [/\bsuhase\b/gi, 'such case'],
  [/\bsuhases\b/gi, 'such cases'],
  [/\bonveys\b/gi, 'conveys'],
  [/\bonvey\b/gi, 'convey'],
  [/\bonveyed\b/gi, 'conveyed'],
  [/\bonveying\b/gi, 'conveying'],
  [/\bsueeds\b/gi, 'succeeds'],
  [/\bsueed\b/gi, 'succeed'],
  [/\bsueeding\b/gi, 'succeeding'],
  [/\bsuess\b/gi, 'success'],
  [/\bsuessful\b/gi, 'successful'],
  [/\bsuessfully\b/gi, 'successfully'],
  [/\bpreedes\b/gi, 'precedes'],
  [/\bpreede\b/gi, 'precede'],
  [/\bpreeding\b/gi, 'preceding'],
  [/\bexeeds\b/gi, 'exceeds'],
  [/\bexeed\b/gi, 'exceed'],
  [/\bexeeding\b/gi, 'exceeding'],
  [/\bexeedingly\b/gi, 'exceedingly'],
  [/\bproeed\b/gi, 'proceed'],
  [/\bproeeds\b/gi, 'proceeds'],
  [/\bproeeding\b/gi, 'proceeding'],
  [/\bneessary\b/gi, 'necessary'],
  [/\bneessarily\b/gi, 'necessarily'],
  [/\bneessity\b/gi, 'necessity'],
  [/\baept\b/gi, 'accept'],
  [/\baepts\b/gi, 'accepts'],
  [/\baepted\b/gi, 'accepted'],
  [/\baepting\b/gi, 'accepting'],
  [/\baeptane\b/gi, 'acceptance'],
  [/\baess\b/gi, 'access'],
  [/\baessed\b/gi, 'accessed'],
  [/\baessing\b/gi, 'accessing'],
  [/\baessible\b/gi, 'accessible'],
  [/\baolade\b/gi, 'accolade'],
  [/\baolades\b/gi, 'accolades'],
  [/\baomplish\b/gi, 'accomplish'],
  [/\baomplished\b/gi, 'accomplished'],
  [/\baomplishment\b/gi, 'accomplishment'],
  [/\baount\b/gi, 'account'],
  [/\baounts\b/gi, 'accounts'],
  [/\baounted\b/gi, 'accounted'],
  [/\baounting\b/gi, 'accounting'],
  [/\baurate\b/gi, 'accurate'],
  [/\baurately\b/gi, 'accurately'],
  [/\bauray\b/gi, 'accuracy'],
  [/\bause\b/gi, 'accuse'],
  [/\baused\b/gi, 'accused'],
  [/\bausing\b/gi, 'accusing'],
  [/\bahieve\b/gi, 'achieve'],
  [/\bahieved\b/gi, 'achieved'],
  [/\bahieving\b/gi, 'achieving'],
  [/\bahievement\b/gi, 'achievement'],
  [/\baknowledge\b/gi, 'acknowledge'],
  [/\baknowledged\b/gi, 'acknowledged'],
  [/\baknowledging\b/gi, 'acknowledging'],
  [/\baknowledgment\b/gi, 'acknowledgment'],
  [/\baquire\b/gi, 'acquire'],
  [/\baquired\b/gi, 'acquired'],
  [/\baquiring\b/gi, 'acquiring'],
  [/\baross\b/gi, 'across'],
  [/\bation\b/gi, 'action'],
  [/\bations\b/gi, 'actions'],
  [/\bative\b/gi, 'active'],
  [/\batively\b/gi, 'actively'],
  [/\batual\b/gi, 'actual'],
  [/\batually\b/gi, 'actually'],

  // 5. tur düzeltmeler
  [/\btoreatures\b/gi, 'to creatures'],
  [/\btoreature\b/gi, 'to creature'],
  [/\btoreation\b/gi, 'to creation'],
  [/\btoreator\b/gi, 'to creator'],
  [/\bthereatures\b/gi, 'the creatures'],
  [/\bthereature\b/gi, 'the creature'],
  [/\bthereation\b/gi, 'the creation'],
  [/\bthereator\b/gi, 'the creator'],
  [/\bareatures\b/gi, 'a creatures'],
  [/\bareature\b/gi, 'a creature'],
  [/\bareation\b/gi, 'a creation'],
  [/\bareator\b/gi, 'a creator'],
  [/\bofreatures\b/gi, 'of creatures'],
  [/\bofreature\b/gi, 'of creature'],
  [/\bofreation\b/gi, 'of creation'],
  [/\bofreator\b/gi, 'of creator'],
  [/\bforreatures\b/gi, 'for creatures'],
  [/\bforreature\b/gi, 'for creature'],
  [/\bforreation\b/gi, 'for creation'],
  [/\ballreatures\b/gi, 'all creatures'],
  [/\ballreation\b/gi, 'all creation'],
  [/\bhisreatures\b/gi, 'his creatures'],
  [/\bhisreation\b/gi, 'his creation'],
  [/\bourreator\b/gi, 'our creator'],
  [/\byourreator\b/gi, 'your creator'],
  [/\btheirreator\b/gi, 'their creator'],

  // 6. tur düzeltmeler
  [/\bandosmology\b/gi, 'and cosmology'],
  [/\bandosmi\b/gi, 'and cosmic'],
  [/\bofosmology\b/gi, 'of cosmology'],
  [/\bofosmi\b/gi, 'of cosmic'],
  [/\binosmology\b/gi, 'in cosmology'],
  [/\binosmi\b/gi, 'in cosmic'],
  [/\btheosmology\b/gi, 'the cosmology'],
  [/\btheosmi\b/gi, 'the cosmic'],
  [/\baosmology\b/gi, 'a cosmology'],
  [/\baosmi\b/gi, 'a cosmic'],
  [/\bosmologial\b/gi, 'cosmological'],
  [/\bosmology\b/gi, 'cosmology'],
  [/\bosmi\b/gi, 'cosmic'],

  // OCR hataları - köşeli parantez ve karakter
  [/\bfis He\]/gi, '[is He]'],
  [/\bfis He\b/gi, '[is He]'],
  [/Al-RahTm/g, 'Al-Rahim'],
  [/al-RahTm/g, 'al-Rahim'],
  [/al-Rahfm/g, 'al-Rahim'],
  [/Al-Rahfm/g, 'Al-Rahim'],
  [/al-Rahím/g, 'al-Rahim'],
  [/Al-Rahím/g, 'Al-Rahim'],
];



// ============================================
// 2. SÖZLÜK OLUŞTUR
// ============================================

// Yaygın İngilizce kelimeler (temel sözlük)
// DİKKAT: Bu kelimelere 'c' EKLENMEYECEK!
const COMMON_WORDS = new Set([
  // Articles & Pronouns
  'a', 'an', 'the', 'this', 'that', 'these', 'those',
  'all', 'each', 'every', 'both', 'few', 'many', 'most', 'other', 'some', 'such', 'no', 'any',
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their',
  'mine', 'yours', 'hers', 'ours', 'theirs',
  'who', 'whom', 'whose', 'which', 'what',

  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from',
  'of', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'over',
  'upon', 'unto', 'within', 'without', 'against', 'among',

  // Conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'for',
  'because', 'although', 'though', 'while', 'if', 'unless',
  'when', 'where', 'whether', 'as', 'than', 'that',

  // Common verbs
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'shall', 'can', 'need', 'dare', 'ought',
  'say', 'said', 'says', 'tell', 'told', 'speak', 'spoke',
  'make', 'made', 'take', 'took', 'give', 'gave', 'given',
  'come', 'came', 'go', 'went', 'gone', 'see', 'saw', 'seen',
  'know', 'knew', 'known', 'think', 'thought', 'believe',
  'find', 'found', 'call', 'called', 'create', 'created',

  // Common nouns
  'god', 'lord', 'prophet', 'messenger', 'people', 'world',
  'day', 'time', 'way', 'life', 'death', 'man', 'men',
  'woman', 'women', 'child', 'children', 'soul', 'heart',
  'book', 'word', 'verse', 'surah', 'quran', 'islam',
  'truth', 'faith', 'belief', 'prayer', 'mercy', 'grace',
  'heaven', 'earth', 'fire', 'water', 'light', 'darkness',
  'command', 'covenant', 'judgment', 'punishment', 'reward',

  // Common adjectives
  'good', 'bad', 'great', 'small', 'new', 'old', 'first',
  'last', 'long', 'short', 'high', 'low', 'right', 'wrong',
  'true', 'false', 'divine', 'holy', 'sacred', 'merciful',
  'compassionate', 'wise', 'just', 'righteous', 'blessed',

  // Common adverbs
  'not', 'also', 'very', 'only', 'just', 'now', 'then',
  'here', 'there', 'where', 'when', 'how', 'why', 'thus',
  'therefore', 'however', 'moreover', 'furthermore', 'indeed',
  'truly', 'verily', 'surely', 'certainly', 'perhaps', 'often',
]);

// C harfi içeren yaygın kelimeler (düzeltme referansı)
const C_WORDS = new Set([
  'call', 'called', 'calling', 'came', 'can', 'cannot', 'case', 'cause', 'caused',
  'center', 'central', 'century', 'certain', 'certainly', 'change', 'changed',
  'character', 'choose', 'chosen', 'christ', 'christian', 'christians',
  'circumstance', 'city', 'claim', 'claimed', 'class', 'clear', 'clearly',
  'close', 'closely', 'closer', 'closest', 'come', 'comes', 'coming',
  'command', 'commanded', 'commands', 'comment', 'commentary', 'commentator',
  'commentators', 'common', 'commonly', 'community', 'companion', 'companions',
  'compare', 'compared', 'compassion', 'compassionate', 'complete', 'completely',
  'comprehend', 'comprise', 'comprises', 'concept', 'concern', 'concerned',
  'concerning', 'conclude', 'concluded', 'conclusion', 'condition', 'conditions',
  'conduct', 'confirm', 'confirmed', 'connected', 'connection', 'conscience',
  'consecrate', 'consecrated', 'consequence', 'consequences', 'consider',
  'considerable', 'consideration', 'considered', 'considering', 'consist',
  'consists', 'constitute', 'constitutes', 'contain', 'contained', 'contains',
  'contemplate', 'context', 'continue', 'continued', 'continues', 'contract',
  'contrary', 'contrast', 'control', 'convey', 'conveyed', 'conveys',
  'convert', 'converted', 'convince', 'convinced', 'correct', 'correctly',
  'correspond', 'cosmic', 'cosmological', 'cosmology', 'could', 'counsel',
  'count', 'counted', 'course', 'covenant', 'cover', 'covered', 'covering',
  'create', 'created', 'creates', 'creating', 'creation', 'creator', 'creature',
  'creatures', 'cross', 'crucial', 'curtain', 'cut',
  // Islamic/Quranic terms
  'caliph', 'caliphs', 'quranic', 'islamic', 'arabic',
  // Academic terms
  'acknowledge', 'acquire', 'act', 'acted', 'action', 'actions', 'active',
  'actual', 'actually', 'accept', 'accepted', 'accepting', 'accompany',
  'accomplish', 'accomplished', 'accord', 'accordance', 'according', 'accordingly',
  'account', 'accounted', 'accounts', 'accurate', 'accurately', 'accuse',
  'accused', 'achieve', 'achieved', 'across', 'fact', 'factor', 'factors',
  'practice', 'practices', 'practical', 'significance', 'significant',
  'specifically', 'specification', 'sacrifice', 'sacrificed',
  'public', 'publication', 'music', 'musical', 'logic', 'logical',
  'magic', 'magical', 'tragic', 'basic', 'ethnic', 'specific', 'scientific',
]);

// ============================================
// 3. DÜZELTME FONKSİYONLARI
// ============================================

function applyPatternFixes(text) {
  let result = text;
  let fixCount = 0;

  for (const [pattern, replacement] of PATTERN_FIXES) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (before !== result) {
      fixCount++;
    }
  }

  return { text: result, fixCount };
}

// Birleşik kelimeleri ayır (basit heuristik)
function splitConcatenatedWords(text) {
  let result = text;
  let fixes = [];

  // Uzun kelimeleri kontrol et (15+ karakter, muhtemelen birleşik)
  const longWordPattern = /\b[a-z]{15,}\b/gi;
  const matches = text.match(longWordPattern) || [];

  for (const word of matches) {
    // Yaygın ayırma noktalarını dene
    const splitPoints = [
      'the', 'and', 'for', 'that', 'with', 'from', 'this', 'which', 'have', 'been',
      'were', 'are', 'was', 'but', 'not', 'all', 'can', 'had', 'her', 'has',
      'his', 'one', 'our', 'out', 'you', 'who', 'its'
    ];

    for (const sp of splitPoints) {
      const idx = word.toLowerCase().indexOf(sp);
      if (idx > 2 && idx < word.length - 3) {
        const part1 = word.substring(0, idx);
        const part2 = word.substring(idx);

        // Her iki parça da makul görünüyorsa ayır
        if (part1.length >= 3 && part2.length >= 3) {
          const fixed = part1 + ' ' + part2;
          result = result.replace(new RegExp('\\b' + word + '\\b', 'g'), fixed);
          fixes.push({ from: word, to: fixed });
          break;
        }
      }
    }
  }

  return { text: result, fixes };
}

// C harfi ekleme denemeleri
function tryAddingC(word) {
  const lowerWord = word.toLowerCase();

  // Zaten sözlükte varsa dokunma
  if (COMMON_WORDS.has(lowerWord) || C_WORDS.has(lowerWord)) {
    return null;
  }

  // Farklı pozisyonlara 'c' ekleyerek dene
  for (let i = 0; i <= word.length; i++) {
    const candidate = word.slice(0, i) + 'c' + word.slice(i);
    if (C_WORDS.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return null;
}

function fixMissingC(text) {
  const words = text.split(/(\s+|[.,;:!?'"()\[\]{}])/);
  let fixCount = 0;

  const result = words.map(word => {
    if (word.length < 3 || !/^[a-zA-Z]+$/.test(word)) {
      return word;
    }

    const fixed = tryAddingC(word);
    if (fixed) {
      fixCount++;
      // Orijinal büyük/küçük harf durumunu koru
      if (word[0] === word[0].toUpperCase()) {
        return fixed.charAt(0).toUpperCase() + fixed.slice(1);
      }
      return fixed;
    }
    return word;
  });

  return { text: result.join(''), fixCount };
}

// ============================================
// 4. ANA İŞLEM
// ============================================

function processFile(filePath) {
  console.log(`\nProcessing: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  let totalPatternFixes = 0;
  let totalCFixes = 0;
  let totalSplitFixes = 0;

  function processValue(value) {
    if (typeof value !== 'string') {
      return value;
    }

    // 1. Pattern-based düzeltmeler
    let { text, fixCount } = applyPatternFixes(value);
    totalPatternFixes += fixCount;

    // 2. Eksik C harfi düzeltmeleri
    const cResult = fixMissingC(text);
    text = cResult.text;
    totalCFixes += cResult.fixCount;

    // 3. Birleşik kelime ayırma
    const splitResult = splitConcatenatedWords(text);
    text = splitResult.text;
    totalSplitFixes += splitResult.fixes.length;

    return text;
  }

  function processObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(processObject);
    }
    if (obj !== null && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = processObject(value);
      }
      return result;
    }
    return processValue(obj);
  }

  const fixedData = processObject(data);

  console.log(`  Pattern fixes: ${totalPatternFixes}`);
  console.log(`  Missing 'c' fixes: ${totalCFixes}`);
  console.log(`  Split fixes: ${totalSplitFixes}`);
  console.log(`  Total fixes: ${totalPatternFixes + totalCFixes + totalSplitFixes}`);

  return fixedData;
}

function main() {
  const dataDir = path.join(__dirname, '../src/data/quran');

  const files = [
    'quran_studyquran.json',
    'studyquran_commentary.json'
  ];

  for (const file of files) {
    const filePath = path.join(dataDir, file);

    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }

    // Yedek al
    const backupPath = filePath.replace('.json', '_backup.json');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`Backup created: ${backupPath}`);
    }

    // Düzelt ve kaydet
    const fixedData = processFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2), 'utf8');
    console.log(`Fixed file saved: ${filePath}`);
  }

  console.log('\nDone!');
}

main();
