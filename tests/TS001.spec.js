// @ts-check
const { test, expect } = require('@playwright/test');
import FormData from 'form-data'
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
    const options = {
      headers: {
        ...formData.getHeaders(),
      },
      data: formData,
    }
    console.log(options);
    const response = await fetch(`${baseUrl}/api/v1/kyc/verifications/${verificationId}/frontIdCards`, {
      method: 'POST',
      ...options,
    });
    const jsonData = await response.json();
    console.log(jsonData);
  });
});

