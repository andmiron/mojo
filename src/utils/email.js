export function constructConfirmationLink(protocol, host, token) {
   return `${protocol}://${host}/verify?token=${token}`
}
