/**
 * UUID v5 生成器（确定性UUID，基于邮箱地址）
 */

// UUID v5 命名空间常量
export const UUID_NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // DNS namespace
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // URL namespace
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8', // ISO OID namespace
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8', // X.500 DN namespace
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
 * 生成 UUID v5（确定性，基于SHA-1哈希）
 * @param namespace - UUID命名空间（使用 UUID_NAMESPACES）
 * @param name - 要哈希的名称（邮箱地址）
 * @returns UUID v5 字符串
 */
export function generateUUIDv5(namespace: string, name: string): string {
  // 将命名空间UUID转换为字节
  const namespaceBytes = uuidToBytes(namespace)
  
  // 准备SHA-1哈希
  const sha1 = new Bun.SHA1()
  
  // 写入命名空间字节
  sha1.update(namespaceBytes)
  
  // 写入名称（UTF-8编码）
  const nameBytes = new TextEncoder().encode(name)
  sha1.update(nameBytes)
  
  // 获取哈希结果
  const hashBytes = sha1.digest()
  
  // 复制前16个字节作为UUID
  const uuidBytes = new Uint8Array(16)
  uuidBytes.set(hashBytes.slice(0, 16))
  
  // 设置版本位为5 (0101)
  uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x50
  
  // 设置变体位为RFC 4122 (10xx)
  uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80
  
  return bytesToUuid(uuidBytes)
}

/**
 * 为邮箱生成UUID v5 ID（不使用用户ID）
 * @param emailAddress - 邮箱地址
 * @returns 基于邮箱的UUID v5
 */
export function generateEmailUUID(emailAddress: string): string {
  // 只使用邮箱地址，不包含用户ID
  const normalizedEmail = emailAddress.toLowerCase().trim()
  
  // 直接使用邮箱地址生成UUID
  return generateUUIDv5(UUID_NAMESPACES.DNS, normalizedEmail)
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
  
  // 检查版本位（第13-14字符的第1位应为5）
  const versionChar = uuid.charAt(14)
  return versionChar === '5'
}
