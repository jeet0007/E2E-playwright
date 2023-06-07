import 'dotenv/config'


// kyc core config
export const kycPrivateKey = process.env.KYC_PRIVATE_KEY || 'kycPrivateKey'
export const kycBaseUrl = process.env.KYC_BASE_URL || 'http://localhost:4000'


// case keeper config
export const caseKeeperBaseUrl = process.env.CASE_KEEPER_BASE_URL || 'http://localhost:4001'