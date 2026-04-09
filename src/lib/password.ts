import bcrypt from 'bcryptjs'

const COST_FACTOR = 12 // SDD sección 5.4: cost factor >= 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST_FACTOR)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
