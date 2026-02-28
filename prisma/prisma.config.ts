import { defineConfig } from '@prisma/client';

export default defineConfig({
    datasources: {
        db: {
            url: 'postgresql://neondb_owner:npg_89pjVAZBzQkn@ep-dark-wildflower-a1sr8phq-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
        }
    }
});
