
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    console.error('DATABASE_URL não configurada.')
    process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function main() {
    const email = process.argv[2]
    const newPassword = process.argv[3]

    if (!email || !newPassword) {
        const users = await db.user.findMany({
            select: { email: true, name: true, role: true }
        })
        console.log('Usuários encontrados no sistema:')
        users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`))
        console.log('\nUso: npx ts-node scripts/reset-password.ts <email> <nova_senha>')
        return
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    const user = await db.user.update({
        where: { email },
        data: { passwordHash }
    })

    console.log(`Senha atualizada para o usuário: ${user.name} (${user.email})`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
        await pool.end()
    })
