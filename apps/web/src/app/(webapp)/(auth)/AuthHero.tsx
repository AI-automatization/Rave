'use client';

/**
 * Auth sahifalarining banner paneli — mahsulot va'dasi.
 *
 * Uch xil holat:
 *  • `< md` (768) — umuman yo'q. Telefonda ekran forma uchun kerak, marketing
 *    uchun emas; qolaversa 58 KB rasm mobil trafikda behuda ketardi.
 *  • `md … lg-1` — sahifa tepasidagi gorizontal tasma (200px). Ilgari bu
 *    oraliqda banner butunlay yo'qolib, ekranning 31–42% i bo'm-bo'sh
 *    qorong'ilik bo'lib qolardi (o'lchangan).
 *  • `≥ lg` (1024) — chap ustun, to'liq kompozitsiya.
 *
 * Tasmada faqat sarlavha qoladi: logotip formadan yuqorida allaqachon bor,
 * tavsif va kartalar esa 200px ga sig'maydi.
 */

import { useTranslations } from 'next-intl';
import { Users, MessageSquare, Heart } from 'lucide-react';
import { WeWatchLogo } from '@/components/common/WeWatchLogo';
import { LOGIN_BANNER_BLUR } from './banner-blur';

const FEATURES = [
  { icon: Users, key: 1 },
  { icon: MessageSquare, key: 2 },
  { icon: Heart, key: 3 },
] as const;

export function AuthHero() {
  const t = useTranslations('auth');

  return (
    <section className="ww-auth-strip relative isolate hidden overflow-hidden md:block">
      {/* next/image emas, balki <picture media> — chunki bu panel `md` dan
          pastda `display:none`, `display:none` esa rasm yuklanishini TO'XTATMAYDI.
          next/image media-shartli manbani qo'llab-quvvatlamaydi, shuning uchun
          mobil qurilma 58 KB bannerni behuda yuklab olardi. Bu yerda mobil
          `<img>` ning src'i 86 baytlik LQIP — ya'ni tarmoqqa umuman
          chiqilmaydi. Fayl allaqachon webp (sharp, 1600px, q80), demak
          next/image ning qayta optimizatsiyasi baribir kerak emas. */}
      {/* `object-cover` bilan to'ldirilganda banner (1686×933, ≈1.81) deyarli
          kvadrat ustunda kuchli kesiladi va televizor yuqoriga chiqib,
          sarlavha aynan uning yorug' ekraniga tushardi. Shuning uchun rasm
          tabiiy nisbatida, vertikal markazdan sal yuqorida turadi — yuqori va
          pastda qolgan bo'sh joy fon rangi bilan bir xil va chetlari
          gradientlar bilan eritiladi. Ya'ni "kesilgan fotosurat" emas,
          fonning bir qismi kabi ko'rinadi. */}
      <picture>
        <source media="(min-width: 768px)" srcSet="/images/login-banner.webp" />
        <img
          src={LOGIN_BANNER_BLUR}
          alt={t('heroImageAlt')}
          /* LCP elementi — kechiktirilsa sahifa ochilishida bo'sh qora maydon */
          fetchPriority="high"
          /* 125% — tabiiy kenglikda sahna juda kichik qolib, atrofida ortiqcha
             bo'sh qorong'ilik hosil bo'lardi. Kattalashtirilganda chap chekka
             sal kesiladi (divandagi ayolning yelkasi) — bu ataylab: kadr
             "ichkaridan" ko'ringandek his beradi. */
          /* Tasmada (md) rasm pastroqqa suriladi (top qiymati katta), shunda
             ko'rinadigan tor darcha kadrning YUQORI qismiga — televizor
             ekraniga to'g'ri keladi. 42% da tasmaga televizorning pastki
             boshqaruv paneli va telefonlar tushib, kesilgan interfeys
             bo'laklari ko'rinardi. */
          className="absolute left-[-12%] top-[64%] w-[125%] max-w-none -translate-y-1/2 lg:top-[52%]"
        />
      </picture>

      {/* Chetlarni eritish. Har biri alohida, chunki to'rt tomon turli
          vazifani bajaradi va bittasini sozlash boshqasini buzmasligi kerak. */}
      <div aria-hidden="true" className="absolute inset-0">
        {/* Yuqori: rasm chekkasi + sarlavha orqasi */}
        <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-[var(--ww-bg)] via-[rgba(5,5,10,0.55)] to-transparent" />
        {/* Past: xususiyat kartalari uchun */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[var(--ww-bg)] via-[rgba(5,5,10,0.60)] to-transparent" />
        {/* Chap: sarlavha va matn kontrasti — rasmning o'zi qorong'i bo'lsa
            ham xona chiroqlari matn ostiga tushishi mumkin */}
        <div className="absolute inset-y-0 left-0 w-[30rem] bg-gradient-to-r from-[rgba(5,5,10,0.92)] via-[rgba(5,5,10,0.45)] to-transparent" />
        {/* O'ng: forma ustuni bilan chok qolmasligi uchun. 192px yetmadi —
            ustun chegarasida ko'zga tashlanadigan vertikal chiziq qolardi.
            O'rtadagi 45% to'xtash "yumshoq quyruq" beradi. Faqat `lg` da:
            tasma rejimida o'ngda forma yo'q, u yerda bu gradient sababsiz
            qorong'i chekka bo'lib qolardi. */}
        <div className="absolute inset-y-0 right-0 hidden w-[22rem] bg-[linear-gradient(to_left,var(--ww-bg)_0%,rgba(5,5,10,0.55)_45%,transparent_100%)] lg:block" />
      </div>

      {/* justify-between edi — sarlavhani vertikal markazga surib, u
          bannerdagi televizor ustiga tushardi. Logo va sarlavha bitta
          yuqori guruh, kartalar esa `mt-auto` bilan pastga bosiladi. */}
      {/* Tasmada (md) faqat sarlavha bor va u vertikal markazda; ustun
          rejimida (lg) logo tepada, sarlavha ostida, kartalar pastda. */}
      <div className="relative z-10 flex h-full flex-col justify-center p-6 sm:p-8 lg:justify-start lg:p-10 xl:p-14">
        {/* Tasmada logo takrorlanmaydi — u formadan yuqorida allaqachon bor */}
        <WeWatchLogo
          iconSize={30}
          className="hidden w-fit transition-opacity hover:opacity-80 lg:block"
        />

        <div className="max-w-[34rem] lg:mt-10 xl:mt-12">
          {/* text-balance — aks holda birinchi satr to'lib ketib, ikkinchisida
              ikki so'z qolardi ("...ham, birga / tomosha qiling."). Brauzer
              satrlarni teng uzunlikka keltiradi; qo'lda <br/> qo'yish esa
              boshqa tillar va ekran kengliklarida buzilardi. */}
          <h2 className="text-balance text-[clamp(1.5rem,3.4vw,2rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-white lg:text-[clamp(2rem,2.6vw,2.75rem)] lg:leading-[1.12]">
            {t.rich('heroTitle', {
              accent: (chunks) => <span className="text-[var(--ww-accent-hi)]">{chunks}</span>,
            })}
          </h2>
          {/* Tavsif va kartalar 200px lik tasmaga sig'maydi — faqat lg da */}
          <p className="mt-5 hidden max-w-[26rem] text-[14.5px] leading-relaxed text-[var(--ww-text-2)] lg:block">
            {t('heroSubtitle')}
          </p>
        </div>

        <ul className="mt-auto hidden flex-wrap gap-3 pt-10 lg:flex">
          {FEATURES.map(({ icon: Icon, key }) => (
            <li
              key={key}
              className="flex items-center gap-3 rounded-[var(--ww-r-md)] border border-[var(--ww-line)] bg-[rgba(13,11,24,0.55)] px-4 py-3 backdrop-blur-md"
            >
              <Icon size={20} aria-hidden="true" className="shrink-0 text-[var(--ww-accent-hi)]" />
              <div className="leading-tight">
                <p className="text-[13.5px] font-semibold text-[var(--ww-text)]">
                  {t(`heroFeature${key}Title`)}
                </p>
                <p className="mt-0.5 text-[12.5px] text-[var(--ww-text-3)]">
                  {t(`heroFeature${key}Desc`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
