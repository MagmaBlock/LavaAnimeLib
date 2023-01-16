/**
 * 200 成功
 * @param {Express.Response} res 
 * @param {*} data 
 * @param {String} message 
 */

export default function success(res, data, message = '成功') {
  if (!res) throw new Error('No res provide')
  if (data) {
    res.status(200).send({ code: 200, message, data: data })
  } else {
    res.status(200).send({ code: 200, message })
  }
}