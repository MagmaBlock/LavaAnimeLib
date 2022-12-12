import { createHash } from 'crypto';

export function getFormattedPassword(password) {
  let salt = generateSalt()
  let sha256Password =
    `sha256:${salt}:` + createHash('sha256')
      .update(password + salt)
      .digest('hex');
  return sha256Password
}

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

// let testPW = '123123123aaa'
// let saved = savePassword(testPW)
// let test1 = testPassword(testPW, saved)
// console.log('用户输入密码:', testPW, '\n保存内容:', saved, '\n再测试结果:', test1);

function generateSalt() {
  let ts = new Date().getTime()
  let random = Math.random()
  let salt = (ts * random).toString()
  let sha1 = createHash('sha1')
    .update(salt)
    .digest('hex')
  return sha1.slice(0, 16)
}