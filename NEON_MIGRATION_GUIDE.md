# Neon PostgreSQL Migration Guide

## ✅ Completed Steps

1. **Updated Prisma Schema** - Changed from SQLite to PostgreSQL
2. **Updated Database Connection** - Now using Prisma Client instead of better-sqlite3
3. **Updated Environment Variables** - Added DATABASE_URL format for Neon

## 🔄 Next Steps

### Step 1: Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string (format: `postgresql://user:password@host/db?sslmode=require`)
4. Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_neon_connection_string_here
   ```

### Step 2: Install Dependencies

```bash
npm install @prisma/client
npm install -D prisma
npx prisma generate
```

### Step 3: Run Migrations

```bash
# Generate migration from schema
npx prisma migrate dev --name init_postgresql

# Or push schema directly (for development)
npx prisma db push
```

### Step 4: Migrate Code from better-sqlite3 to Prisma

**Files that need updating:**

#### Server Routes (HIGH PRIORITY)
- ✅ `server/db.js` - DONE
- ⚠️ `server/routes/data.js` - Needs migration
- ⚠️ `server/routes/auth.js` - Needs migration  
- ⚠️ `server/routes/patients.js` - Needs migration
- ⚠️ `server/routes/clinics.js` - Needs migration
- ⚠️ `server/routes/billing.js` - Needs migration
- ⚠️ `server/routes/superadmin.js` - Needs migration
- ⚠️ `server/middleware/subscription.js` - Needs migration

#### Utility Scripts (LOW PRIORITY - for testing only)
- `check-user-roles.js`
- `add-super-admin.js`
- `create-test-user.js`
- `setup-user-clinic.js`
- `test-login-diagnostic.js`
- `test-db-simple.js`
- `prisma/seed-plans.js`
- `prisma/migrate-subscription.js`

## 📝 Code Migration Patterns

### Old SQLite Pattern → New Prisma Pattern

#### SELECT Queries

**Before (SQLite):**
```javascript
const user = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
const users = db.prepare('SELECT * FROM User WHERE clinicId = ?').all(clinicId);
```

**After (Prisma):**
```javascript
const user = await prisma.user.findUnique({ where: { email } });
const users = await prisma.user.findMany({ where: { clinicId } });
```

#### INSERT Queries

**Before (SQLite):**
```javascript
const result = db.prepare(`
  INSERT INTO User (email, password, fullName) 
  VALUES (?, ?, ?)
`).run(email, password, fullName);
const userId = result.lastInsertRowid;
```

**After (Prisma):**
```javascript
const user = await prisma.user.create({
  data: { email, password, fullName }
});
const userId = user.id;
```

#### UPDATE Queries

**Before (SQLite):**
```javascript
db.prepare('UPDATE User SET lastLogin = ? WHERE id = ?')
  .run(new Date().toISOString(), userId);
```

**After (Prisma):**
```javascript
await prisma.user.update({
  where: { id: userId },
  data: { lastLogin: new Date() }
});
```

#### DELETE Queries

**Before (SQLite):**
```javascript
db.prepare('DELETE FROM User WHERE id = ?').run(userId);
```

**After (Prisma):**
```javascript
await prisma.user.delete({ where: { id: userId } });
```

#### Complex Joins

**Before (SQLite):**
```javascript
const doctors = db.prepare(`
  SELECT u.*, dp.* 
  FROM User u
  JOIN DoctorProfile dp ON dp.userId = u.id
  WHERE u.id = ?
`).all(clinicId);
```

**After (Prisma):**
```javascript
const doctors = await prisma.user.findMany({
  where: { clinics: { some: { clinicId } } },
  include: { doctorProfile: true }
});
```

## 🚀 Deployment Considerations for Android

### Architecture
Your app uses **Capacitor** with a **client-server architecture**:
- **Android App (Frontend)** → Calls API endpoints
- **Backend Server** → Connects to Neon PostgreSQL

### Key Points:
1. ✅ **No database in the Android app** - The app makes HTTP requests to your backend
2. ✅ **Centralized data** - All Android devices connect to the same Neon database
3. ✅ **Real-time sync** - Multiple users can access the same clinic data
4. ✅ **Secure** - Database credentials stay on the server, not in the app

### Environment Variables for Production:
```env
# Production .env file
DATABASE_URL=your_production_neon_connection_string
NODE_ENV=production
```

## 📊 Why Neon is Perfect for Your Use Case

| Feature | Why It Matters for Clinic-Central |
|---------|-----------------------------------|
| **Serverless** | No infrastructure management needed |
| **Auto-scaling** | Handles multiple clinic locations accessing simultaneously |
| **Branching** | Create dev/staging database branches easily |
| **Point-in-time recovery** | Critical for medical data compliance |
| **Connection pooling** | Handles many concurrent Android app connections |
| **Free tier** | Start free, scale as you grow |

## ⚠️ Important Notes

1. **Add async/await**: Prisma Client is async, so all database operations need `async/await`
2. **Update route handlers**: Make sure all Express routes are `async` functions
3. **Error handling**: Prisma throws different errors than SQLite
4. **Transactions**: Use `prisma.$transaction()` for multi-step operations
5. **Testing**: Test thoroughly before deploying to Android

## 🔧 Optional: Keep SQLite for Local Development

You can use SQLite locally and Neon in production:

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then use different DATABASE_URL values:
- Local: `file:./dev.db` (SQLite)
- Production: `postgresql://...` (Neon)

## 📞 Need Help?

If you encounter issues during migration:
1. Check [Prisma Docs](https://www.prisma.io/docs)
2. Review [Neon Documentation](https://neon.tech/docs)
3. Test each route individually before deploying

---

**Ready to migrate?** Start with Step 1 above and let me know if you need help with any specific file migration!
