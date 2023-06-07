// @ts-check
const { test, expect } = require('@playwright/test');
import FormData from 'form-data'
import axios from 'axios';
import fs from 'fs';
import path from 'path';

let token = undefined;
const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const realm = process.env.REALM || 'mac-portal';
const clientId = process.env.CLIENT_ID || 'clientId'
const clientSecret = process.env.CLIENT_SECRET || 'clientSecret'


test.beforeAll(async ({ request }) => {
  const auth = await request.post(`/auth/realms/${realm}/protocol/openid-connect/token`, {
    form: {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    failOnStatusCode: true,
  })

  expect(auth.ok).toBeTruthy();
  const response = await auth.json()
  token = response.access_token;
  expect(token).toBeDefined();
});

test.describe("TS001", () => {
  let verificationId = undefined
  test('Agent create case', async ({ request }) => {
    expect(token).toBeDefined();
    const response = await request.post(`/api/v2/case-keeper/cases`, {
      data: {
        proprietors: [
          {
            verifications: [
              {
                frontIdCardConfig: {
                  required: true,
                  attempts: 3,
                  threshHold: 0.8,
                  dependenciesRequired: true,
                  isEditable: false
                },
                backIdCardConfig: {
                  required: true,
                  dependenciesRequired: false,
                  isEditable: false
                },
                dopaConfig: {
                  required: true,
                  attempts: 3,
                  livenessCount: 1,
                  threshHold: 0.8,
                  dependenciesRequired: false,
                  isEditable: false
                }
              }
            ]
          }
        ]

      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    expect(response.ok).toBeTruthy();
    const jsonData = await response.json();
    expect(jsonData).toBeDefined();
    const { proprietors } = jsonData;
    expect(proprietors).toBeDefined();
    expect(proprietors.length).toBe(1);
    const { verifications } = proprietors[0]
    expect(verifications).toBeDefined();
    expect(verifications.length).toBe(1);
    const { id } = verifications[0];
    expect(id).toBeDefined();
    verificationId = id;
  });

  test("Client should be able to access without auth", async ({ request }) => {
    const response = await request.get(`/api/v1/kyc/verifications/${verificationId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    });
    expect(response.ok).toBeTruthy();
  });

  test("Client accepts pdpa", async ({ request }) => {
    const response = await request.patch(`/api/v1/kyc/verifications/${verificationId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        pdpaConsented: true,
        welcomeConfirmed: true,
      },
      failOnStatusCode: false,
    });
    expect(response.ok).toBeTruthy();
    const jsonData = await response.json();
    expect(jsonData).toBeDefined();
    const { pdpaConsented, welcomeConfirmed } = jsonData;
    expect(pdpaConsented).toBeTruthy();
    expect(welcomeConfirmed).toBeTruthy();
  });

  test("Client does FrontId card", async ({ request }) => {
    const imagePath = path.join(__dirname, '../assets/frontIdCard.jpg');
    const frontIdCard = fs.readFileSync(imagePath);
    const formData = new FormData();
    formData.append('file', frontIdCard, { filename: 'frontIdCard.jpg', contentType: 'image/jpeg', knownLength: frontIdCard.length });
    const response = await axios.post(`${baseUrl}/api/v1/kyc/verifications/${verificationId}/frontIdCards`, formData, {
      headers: {
        ...formData.getHeaders(),
      }
    })
    expect(response.status).toBe(200);
    const jsonData = response.data;
    expect(jsonData).toBeDefined();
    const { frontIdCardResult } = jsonData;
    expect(frontIdCardResult).toBeDefined();
    const { verified, confirmed } = frontIdCardResult;
    expect(verified).toBeFalsy();
    expect(confirmed).toBeFalsy();
  });

  test("Client confirms FrontId card", async ({ request }) => {
    const response = await request.patch(`/api/v1/kyc/verifications/${verificationId}/frontIdCards`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        confirmed: true,
      },
      failOnStatusCode: false,
    });
    expect(response.ok).toBeTruthy();
    const jsonData = await response.json();
    expect(jsonData).toBeDefined();
    const { frontIdCardResult } = jsonData;
    expect(frontIdCardResult).toBeDefined();
    const { verified, confirmed } = frontIdCardResult;
    expect(verified).toBeTruthy();
    expect(confirmed).toBeTruthy();
  });

  test("Client does BackId card", async ({ request }) => {
    const imagePath = path.join(__dirname, '../assets/backIdCard.jpg');
    const backIdCard = fs.readFileSync(imagePath);
    const formData = new FormData();
    formData.append('file', backIdCard, { filename: 'backIdCard.jpg', contentType: 'image/jpeg', knownLength: backIdCard.length });
    const response = await axios.post(`${baseUrl}/api/v1/kyc/verifications/${verificationId}/backIdCards`, formData, {
      headers: {
        ...formData.getHeaders(),
      }
    })
    expect(response.status).toBe(200);
    const jsonData = response.data;

    expect(jsonData).toBeDefined();
    const { backIdCardResult } = jsonData;
    expect(backIdCardResult).toBeDefined();
    const { verified, confirmed } = backIdCardResult;
    expect(verified).toBeFalsy();
    expect(confirmed).toBeFalsy();
  });

  test("Client confirms BackId card", async ({ request }) => {
    const response = await request.patch(`/api/v1/kyc/verifications/${verificationId}/backIdCards`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        confirmed: true,
      },
      failOnStatusCode: false,
    });
    expect(response.ok).toBeTruthy();
    const jsonData = await response.json();
    expect(jsonData).toBeDefined();
    const { backIdCardResult } = jsonData;
    expect(backIdCardResult).toBeDefined();
    const { verified, confirmed } = backIdCardResult;
    expect(verified).toBeTruthy();
    expect(confirmed).toBeTruthy();
  });
  test("Client confirms Dopa", async ({ request }) => {
    console.log('verificationId', verificationId);
    const response = await request.patch(`/api/v1/kyc/verifications/${verificationId}/dopa`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        confirmed: true,
      },
      failOnStatusCode: false,
    });
    expect(response.ok).toBeTruthy();
    const jsonData = await response.json();
    expect(jsonData).toBeDefined();
    const { dopaResult, status } = jsonData;
    expect(dopaResult).toBeDefined();
    const { verified, confirmed } = dopaResult;
    expect(verified).toBeTruthy();
    expect(confirmed).toBeTruthy();
  });
});


