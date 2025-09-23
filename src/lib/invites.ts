import crypto from 'crypto'

export type OrgInvitePayload = {
	orgId: string
	email: string
	exp: number // epoch ms
}

function b64urlEncode(input: Buffer | string): string {
	const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
	return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function b64urlDecode(input: string): Buffer {
	const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
	const normalized = input.replace(/-/g, '+').replace(/_/g, '/') + pad
	return Buffer.from(normalized, 'base64')
}

function getSecret(): string {
	return process.env.INVITE_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret'
}

export function createOrgInviteToken(payload: OrgInvitePayload): string {
	const json = JSON.stringify(payload)
	const body = b64urlEncode(json)
	const sig = crypto.createHmac('sha256', getSecret()).update(body).digest()
	return `${body}.${b64urlEncode(sig)}`
}

export function verifyOrgInviteToken(token: string): OrgInvitePayload | null {
	if (!token || typeof token !== 'string' || !token.includes('.')) return null
	const [body, sig] = token.split('.')
	const expected = b64urlEncode(crypto.createHmac('sha256', getSecret()).update(body).digest())
	if (sig !== expected) return null
	try {
		const json = b64urlDecode(body).toString('utf8')
		const payload = JSON.parse(json) as OrgInvitePayload
		if (!payload.orgId || !payload.exp) return null
		if (Date.now() > Number(payload.exp)) return null
		return payload
	} catch {
		return null
	}
}


