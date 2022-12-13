export default function success(res, data, message = '成功') {
  // 传入 res, 直接回复 404
  if (!res) throw new Error('No res provide')
  if (data) {
    res.status(200).send({ code: 200, message, data: data })
  } else {
    res.status(200).send({ code: 200, message })
  }
}