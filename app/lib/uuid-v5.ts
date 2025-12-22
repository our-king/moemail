/**
 * UUID v5 生成器（确定性UUID，基于邮箱地址）
 * 纯TypeScript实现，无外部依赖
 */

// UUID v5 命名空间常量
export const UUID_NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // DNS namespace
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // URL namespace
} as const

/**
 * 将UUID字符串转换为字节数组（移除连字符）
 */
function uuidToBytes(uuid: string): Uint8Array {
  // 移除连字符
  const hex = uuid.replace(/-/g, '')
  if (hex.length !== 32) {
    throw new Error('Invalid UUID format')
  }
  
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

/**
 * 将字节数组转换为UUID字符串（添加连字符）
 */
function bytesToUuid(bytes: Uint8Array): string {
  if (bytes.length !== 16) {
    throw new Error('Invalid byte array length')
  }
  
  const hex: string[] = []
  for (let i = 0; i < bytes.length; i++) {
    hex.push(bytes[i].toString(16).padStart(2, '0'))
  }
  
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

/**
 * 生成 UUID v5（使用Web Crypto API，兼容Edge Runtime）
 */
export function generateUUIDv5(namespace: string, name: string): string {
  // 将命名空间UUID转换为字节
  const namespaceBytes = uuidToBytes(namespace)
  
  // 使用Web Crypto API计算SHA-1哈希
  const encoder = new TextEncoder()
  const data = new Uint8Array(namespaceBytes.length + encoder.encode(name).length)
  
  data.set(namespaceBytes)
  data.set(encoder.encode(name), namespaceBytes.length)
  
  // 计算SHA-1哈希
  return crypto.subtle.digest('SHA-1', data)
    .then(hashBuffer => {
      const hashBytes = new Uint8Array(hashBuffer)
      
      // 复制前16个字节作为UUID
      const uuidBytes = new Uint8Array(16)
      for (let i = 0; i < 16; i++) {
        uuidBytes[i] = hashBytes[i]
      }
      
      // 设置版本位为5 (0101)
      uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x50
      
      // 设置变体位为RFC 4122 (10xx)
      uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80
      
      return bytesToUuid(uuidBytes)
    })
}

/**
 * 为邮箱生成UUID v5 ID（不使用用户ID）- 异步版本
 */
export async function generateEmailUUIDAsync(emailAddress: string): Promise<string> {
  const normalizedEmail = emailAddress.toLowerCase().trim()
  return generateUUIDv5(UUID_NAMESPACES.DNS, normalizedEmail)
}

/**
 * 同步版本的邮箱UUID生成器（简化实现）
 */
export function generateEmailUUID(emailAddress: string): string {
  const normalizedEmail = emailAddress.toLowerCase().trim()
  
  // 简化的实现，使用固定算法生成确定性ID
  // 注意：这不是标准的UUID v5，但能满足大多数需求
  const text = `email_${normalizedEmail}`
  const hash = simpleHash(text)
  
  // 格式化为UUID样式
  return formatAsUUID(hash)
}

/**
 * 简单哈希函数（非加密安全，仅用于生成确定性ID）
 */
function simpleHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash |= 0 // 转换为32位整数
  }
  
  // 转换为十六进制并填充
  return Math.abs(hash).toString(16).padStart(32, '0')
}

/**
 * 将32字符哈希格式化为UUID样式
 */
function formatAsUUID(hash: string): string {
  if (hash.length !== 32) {
    throw new Error('Hash must be 32 characters')
  }
  
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-')
}

/**
 * 验证字符串是否为有效的UUID格式
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * 验证UUID是否为v5版本
 */
export function isUUIDv5(uuid: string): boolean {
  if (!isValidUUID(uuid)) return false
  
  // 检查版本位（第14个字符应为5）
  const versionChar = uuid.charAt(14)
  return versionChar === '5'
}
