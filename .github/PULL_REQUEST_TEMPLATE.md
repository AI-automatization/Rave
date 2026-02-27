## 📋 Umumiy ma'lumot

**Task:** T-S0XX / T-E0XX / T-J0XX / T-C0XX
**Tur:** `feat` / `fix` / `refactor` / `chore` / `docs` / `test`
**Bog'liq PR:** #

## 📝 Tavsif

> Bu PR nima qiladi? Qanday muammoni hal qiladi?

## 🔗 O'zgartirilgan fayllar

| Fayl | O'zgarish turi |
|------|---------------|
| `services/.../` | yangi / o'zgartirildi |
| `shared/...` | yangi / o'zgartirildi |

## ✅ Tekshiruv ro'yxati

### Kod sifati
- [ ] `npm run typecheck` — 0 xato
- [ ] `console.log` ishlatilmagan (Winston logger)
- [ ] `any` type ishlatilmagan (TypeScript strict)
- [ ] 400+ qatorli fayl yo'q
- [ ] Magic number yo'q — `const` bilan nomlangan

### Xavfsizlik
- [ ] JWT tekshirilgan (agar auth kerak bo'lsa)
- [ ] Input validation (Joi/Zod)
- [ ] SQL/NoSQL injection xavfi yo'q
- [ ] Secrets `.env` da, hardcoded emas

### Backend spetsifik
- [ ] Controller faqat HTTP (logika service da)
- [ ] ApiResponse formati saqlangan: `{ success, data, message, errors }`
- [ ] Socket.io event nomlari o'zgartirilmagan (agar tegilgan bo'lsa)
- [ ] Shared types o'zgartirilmagan (yoki jamoaga xabar berilgan)

### Zona
- [ ] `apps/mobile/` ga tegmagan (Emirhan zonasi)
- [ ] `apps/web/` ga tegmagan (Jafar zonasi)

## 🧪 Test

```bash
# Qanday test qilish mumkin:
curl -X GET http://localhost:PORT/api/v1/...
```

## 📸 Screenshot (agar UI bo'lsa)

---
*CineSync | PR Template v1.0*
