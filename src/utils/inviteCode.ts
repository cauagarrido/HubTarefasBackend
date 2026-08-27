import crypto from 'crypto';

// Alfabeto legível evitando caracteres ambíguos (sem 0, O, I, 1, L)
const SAFE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Gera um código de convite amigável e único com o prefixo 'HUB-'
 * Exemplo: 'HUB-8F2K9A'
 *
 * @param length Quantidade de caracteres aleatórios após o prefixo (padrão: 6)
 * @returns Código formatado (ex: HUB-8F2K9A)
 */
export const generateInviteCode = (length: number = 6): string => {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = bytes[i] % SAFE_ALPHABET.length;
    code += SAFE_ALPHABET[randomIndex];
  }
  return `HUB-${code}`;
};

/**
 * Valida se um código segue o padrão 'HUB-XXXXXX'
 *
 * @param code Código a ser validado
 * @returns boolean indicando se o formato é válido
 */
export const isValidInviteCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  const regex = /^HUB-[2-9A-HJ-NP-Z]{4,10}$/i;
  return regex.test(code.trim().toUpperCase());
};

/**
 * Normaliza o código para maiúsculas e remove espaços
 */
export const normalizeInviteCode = (code: string): string => {
  return code ? code.trim().toUpperCase() : '';
};
