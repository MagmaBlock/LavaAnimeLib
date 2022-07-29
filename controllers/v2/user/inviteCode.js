import { createHash } from 'crypto';

export function generateInviteCode() { // 生成邀请码
    let nowTime = new Date().getTime();
    let randomNumer = Math.floor(Math.random() * 100);
    let result = nowTime * randomNumer;
    let inviteCode = createHash('sha1')
        .update(result.toString())
        .digest('hex')
    return inviteCode;
}
