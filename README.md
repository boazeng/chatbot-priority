# צ'אטבוט לדיווח תקלות - חניה אורבנית

מערכת צ'אטבוט חכמה לדיווח על תקלות ושליחת הודעות עבור חניה אורבנית.

## תכונות עיקריות

- דיווח על תקלות במתקני חניה
- השארת הודעות כלליות
- איסוף פרטי קשר (טלפון/מספר לקוח)
- תיעוד כתובת האתר ותיאור התקלה
- שליחת סיכום דיווח במייל
- תמיכה בשפה העברית

## התקנה

1. התקן את הדיפנדנסיז:
```bash
npm install
```

2. צור קובץ `.env.local` בהתבסס על `.env.example` והגדר את המשתנים הסביבתיים הנדרשים:
- מפתח API של OpenAI
- הגדרות SMTP לשליחת מיילים
- הגדרות Supabase (אם נדרש)

3. הפעל את שרת הפיתוח:
```bash
npm run dev
```

## שימוש

הצ'אטבוט מנהל שיחה עם המשתמש ואוסף את המידע הנדרש בהתאם לסוג הפניה (תקלה או הודעה).

### דיווח על תקלה
1. זיהוי סוג הפניה
2. איסוף פרטי קשר
3. קבלת כתובת האתר
4. תיאור התקלה
5. בדיקת מצב המתקן (מושבת/פעיל)
6. שליחת סיכום במייל

### השארת הודעה
1. זיהוי סוג הפניה
2. איסוף פרטי קשר
3. קבלת תוכן ההודעה
4. שליחת סיכום במייל

## טכנולוגיות

- Next.js
- TypeScript
- OpenAI API
- Nodemailer
- Supabase (אופציונלי)

## פיתוח עתידי

- חיבור למערכת CRM
- ניתוח AI לזיהוי תקלות חוזרות
- תמיכה בשפות נוספות
- צ'אט קולי

## תמיכה

אם נתקלת בבעיות או יש לך שאלות:
1. בדוק שכל משתני הסביבה מוגדרים נכון
2. ודא שיש לך מפתח API תקין מ-OpenAI
3. בדוק שכל החבילות הותקנו בהצלחה 