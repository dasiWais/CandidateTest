# Requests - Search & Filter

הגשה למבחן, כל שלושת החלקים:

- **חלק א׳** (ה-README הזה + הקוד ב-`src/`, `tests/`, `frontend/`): חיפוש/סינון/מיון שנוספו ל-API הקיים של Requests, יחד עם ממשק Angular.
- **חלק ב׳** (ארכיטקטורה) ו-**חלק ג׳** (פריסה בענן): מסמך אחד מבוסס דיאגרמות, מקושר בסעיף [Architecture & Cloud](#architecture--cloud-חלק-ב--ג) למטה.
- **AI-usage.md**: ראו [AI-usage.md](AI-usage.md) בשורש הריפו.

## Stack

- **Backend**: נשמר הפרויקט הנתון .NET 8 / ASP.NET Core / EF Core כמות שהוא (Clean Architecture: `Requests.Domain` → `Requests.Application` → `Requests.Infrastructure`/`Requests.Api`).
- **Frontend**: Angular (v22, standalone components, signals) — נבחר לפי האפשרות "Angular או React" שבמטלה; אין צורך בהצדקה נוספת כיוון שזו בחירה מוצעת מראש, לא שינוי טכנולוגיה.

## איך מריצים

### Backend

```bash
dotnet run --project src/Requests.Api
```

מאזין על `http://localhost:60702` (וגם `https://localhost:60701`) לפי `src/Requests.Api/Properties/launchSettings.json`. Swagger UI בכתובת `/swagger` בסביבת Development. מסד הנתונים ה-in-memory מאותחל עם 2000 רשומות דטרמיניסטיות עם עליית המערכת.

### Frontend

```bash
cd frontend
npm install
npm start
```

רץ על `http://localhost:4200` ומעביר (proxy) את `/api/*` אל `http://localhost:60702` (`frontend/proxy.conf.json`), כך שלא היה צורך בהגדרת CORS בצד ה-API.

### בדיקות

```bash
dotnet test tests/Requests.Tests
cd frontend && npm test
```

## API

`GET /api/requests`

| פרמטר Query    | טיפוס                              | הערות                                     |
|----------------|------------------------------------|--------------------------------------------|
| `requestNumber`| string                             | התאמה חלקית (`Contains`)                   |
| `statuses`     | חוזר, שם ה-enum (`New`, ...)       | אפס, אחד, או כמה                           |
| `types`        | חוזר, שם ה-enum                    | אפס, אחד, או כמה                           |
| `createdFrom`  | תאריך/זמן ISO                      | כולל                                       |
| `createdTo`    | תאריך/זמן ISO                      | כולל                                       |
| `sortBy`       | `RequestNumber\|CustomerId\|Status\|RequestType\|CreatedAt` | ברירת מחדל `CreatedAt` |
| `sortDir`      | `Ascending\|Descending`            | ברירת מחדל `Descending`                    |
| `page`         | int ≥ 1                            | ברירת מחדל 1                               |
| `pageSize`     | int 1-200                          | ברירת מחדל 25                              |

Headers (ללא שינוי מהקוד הנתון, מתועדים ב-`RequestsController`): `X-User-Id`, `X-Is-Admin` — תחליף לאימות אמיתי, לצורך התרגיל בלבד.

הצלחה (200):
```json
{ "items": [ /* RequestDto[] */ ], "totalCount": 743, "page": 1, "pageSize": 25 }
```

קלט לא תקין (400) — `ValidationProblemDetails` סטנדרטי של ASP.NET Core, שגיאה אחת לכל שדה לא תקין, למשל `createdFrom > createdTo`, ערך status לא קיים, או `pageSize > 200`.

## החלטות טכניות עם חלופות

**Paging: `Skip/Take`, לא keyset/seek pagination.** בחרתי בגישה הפשוטה והמוכרת (`Skip/Take`) על פני seek pagination (`WHERE (CreatedAt, Id) < (@lastCreatedAt, @lastId)`), כי היא הרבה יותר פשוטה למימוש כששדה המיון משתנה לפי בחירת המשתמש. ה-tradeoff האמיתי: בעמודים עמוקים מאוד על פני מיליוני רשומות, `OFFSET` הופך יקר יותר ויותר על בסיס נתונים אמיתי. אם paging עמוק בסקייל כזה היה קריטי כאן, seek pagination היה הצעד הבא.

**Frontend: Signals + Standalone Components, לא NgRx.** האפליקציה היא עמוד חיפוש יחיד עם state מקומי ופשוט (פילטרים, מיון, עמוד נוכחי, תוצאה) — NgRx מוסיף boilerplate משמעותי (actions/reducers/effects/selectors) בלי הצדקה אמיתית בהיקף הזה. Signals נותנים reactivity מספיק טוב עם הרבה פחות קוד, ו-Standalone Components (בלי NgModules) הם הכיוון העדכני של Angular ממילא — בחירה שהייתה נכונה גם בלי קשר לגודל האפליקציה.

## Architecture & Cloud (חלק ב׳ + ג׳)

[Requests Platform Blueprint](https://claude.ai/artifact/MiGbToH8i3FY1UdVZtfp42) — עמוד אחד שמכסה את שני החלקים: טופולוגיית השירותים, בעלות על נתונים, תקשורת sync מול async, תרחיש ההתראה האמינה (Outbox + תור עמיד + idempotency + DLQ), מסלול המעבר, וסקיצת הפריסה בענן על Azure (Compute/DB/Messaging/Monitoring/Scaling).

עותק של אותו עמוד קיים גם בריפו עצמו ב-[`docs/architecture.html`](docs/architecture.html) (לפתוח ישירות בדפדפן), למקרה שהלינק החי לא משותף/נגיש. הלינק החי הוא אותו תוכן, חי — **יש לשתף אותו מתפריט השיתוף בעמוד** לפני ההגשה אם רוצים שהבודק ייפתח אותו ישירות, כי artifacts הם פרטיים כברירת מחדל.

## הנחות שביצעתי

**מסד הנתונים נשאר InMemory.** לא עברתי לבסיס נתונים רלציוני אמיתי — נשארתי עם ה-EF Core InMemory provider, בדיוק כמו בפרויקט הנתון. זה מספיק כדי להראות שהשאילתות בנויות נכון (סינון, מיון, דפדוף), אבל יש לזה שתי מגבלות שכדאי לדעת: (1) האינדקסים שהצהרתי ב-`RequestsDbContext` לא באמת "עובדים" — InMemory מתעלם מהם לגמרי, הם שם רק כתיעוד של הכוונה לפרודקשן; (2) `Contains()` על InMemory לא בהכרח מתנהג בדיוק כמו `LIKE` על בסיס נתונים אמיתי (למשל ברגישות לרישיות). ומאותה סיבה — אין migrations של EF Core בפרויקט, כי אין סכמה רלציונית אמיתית שצריך למגרט.

**ה-headers של האימות נשארו כמו שהיו.** לא בניתי אימות אמיתי. שמרתי על ה-pseudo-auth מבוסס ה-headers (`X-User-Id` / `X-Is-Admin`) מה-controller הנתון, והרחבתי אותו — לא החלפתי אותו. זו הייתה כוונת התרגיל מלכתחילה (יש הערה בקוד המקורי שאומרת את זה), ובארכיטקטורת חלק ב׳ כתבתי במפורש שברגע שיש יותר משירות אחד, זה חייב להתחלף ב-IdP אמיתי (Microsoft Entra ID) — לא ניתן להישאר עם headers גלויים בעולם של Microservices.

**אין CORS, יש proxy.** כדי שה-Frontend וה-Backend ידברו בפיתוח, השתמשתי ב-proxy של שרת הפיתוח של Angular (`frontend/proxy.conf.json`) במקום להגדיר CORS ב-API. זו לא רק נוחות — בפריסה האמיתית (חלק ג׳) שני הצדדים יושבים ממילא מאחורי אותו API Management gateway, כך שבפרודקשן בכלל לא נוצרת בקשת cross-origin שדורשת CORS.

**כמות ה-seed הוגדלה, לא בשביל "לדמות מיליונים".** הגדלתי מ-500 ל-2000 רשומות רק כדי שדפדוף וסינון יהיו ניתנים להדגמה אמיתית מקומית (יותר מעמוד אחד של תוצאות). זו נוחות פיתוח בלבד — התמיכה במיליוני רשומות בפועל לא באה מכמות ה-seed, אלא מעיצוב השאילתה עצמו (סינון/מיון/דפדוף שקורים כולם בצד השרת, פלוס האינדקסים המתועדים), כמו שהסברתי למעלה.

## מה לא הספקתי

- **אין בדיקות אינטגרציה ברמת HTTP ל-`RequestsController`** (למשל דרך `WebApplicationFactory`) — הכיסוי הנוכחי הוא ברמת השירות (fake repository), ה-repository (EF InMemory אמיתי), ומודל הוולידציה. בדיקת אינטגרציה שמפעילה את כל ה-pipeline (model binding → validation → headers → צורת התשובה) הייתה סוגרת את הפער; הייתי מוסיף אותה עם `Microsoft.AspNetCore.Mvc.Testing` כצעד הבא.
- **אין "קפיצה לעמוד N"** בטבלת התוצאות, רק Previous/Next — פישוט מכוון לאור מגבלת הזמן, לא מגבלה טכנית; ה-API כבר מקבל כל ערך `page`.

---

תודה רבה על ההזדמנות.
