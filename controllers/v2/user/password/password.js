import { createHash } from 'crypto';


/**
 * 校验密码是否正确，需要提供从数据库中来的密码格式
 * @param {String} password 
 * @param {String} saltyPassword 
 * @returns {Boolean} is correct
*/
export function testPassword(password, saltyPassword) {
  let saltyPasswordGroup = saltyPassword.split(':')
  if (saltyPasswordGroup[0] == 'sha256') {
    let test = createHash('sha256') // 使用用户提交的密码，用指定的盐值再次加密一次测试
      .update(password + saltyPasswordGroup[1])
      .digest('hex');
    if (test == saltyPasswordGroup[2]) {
      return true
    }
    else {
      return false
    }
  }
}


/**
 * 检查字符串是否是一个足够复杂的密码
 * @param {String} password
 * @returns {Boolean} 
 */
export function isSecurePassword(password) {
  if (/^(?=.*[a-zA-Z]).{7,64}$/.test(password)) { // 符合
    return true
  }
  return false
}

/**
 * 获取存储到数据库中使用的加密密码文本
 * @param {String} password 
 * @returns {String} sha256Password
 */
export function getFormattedPassword(password) {
  let salt = generateSalt()
  let sha256Password =
    `sha256:${salt}:` + createHash('sha256')
      .update(password + salt)
      .digest('hex');
  return sha256Password
}

/**
 * 获得一个随机的盐值, length 16
 * @returns {String} salt
 */
function generateSalt() {
  let ts = new Date().getTime()
  let random = Math.random()
  let salt = (ts * random).toString()
  let sha1 = createHash('sha1')
    .update(salt)
    .digest('hex')
  return sha1.slice(0, 16)
}