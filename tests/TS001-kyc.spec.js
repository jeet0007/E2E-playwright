import { test, expect } from '@playwright/test';
import { createVerification, patchVerification, uploadIdCard, patchVerificationProcess } from '../services/kyc-core'
import { kycPrivateKey } from '../config/env';
import FormData from 'form-data'
import fs from 'fs';
import path from 'path';




test.describe("Create Verification using api", () => {
    let verificationId = undefined
    test('Create Verification', async () => {
        const response = await createVerification(
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
            },
            kycPrivateKey
        );
        expect(response.status).toBe(200);
        const data = response.data;
        expect(data).toBeDefined();
        const { id } = data || {};
        expect(id).toBeDefined();
        verificationId = id
    });

    test("Patch Welcome and PDPA", async () => {
        const response = await patchVerification(verificationId, {
            pdpaConsented: true,
            welcomeConfirmed: true,
        })
        expect(response.status).toBe(200);
        const data = response.data;
        expect(data).toBeDefined();
        const { pdpaConsented, welcomeConfirmed } = data || {};
        expect(pdpaConsented).toBeTruthy();
        expect(welcomeConfirmed).toBeTruthy();
    })

    test("Client upload front id card", async () => {
        const imagePath = path.join(__dirname, '../assets/frontIdCard.jpg');
        const frontIdCard = fs.readFileSync(imagePath);
        const formData = new FormData();
        formData.append('file', frontIdCard, { filename: 'frontIdCard.jpg', contentType: 'image/jpeg', knownLength: frontIdCard.length });
        const response = await uploadIdCard(verificationId, formData)
        expect(response.status).toBe(200);
        const data = response.data;
        expect(data).toBeDefined();
        const { frontIdCardResult } = data;
        expect(frontIdCardResult).toBeDefined();
        const { verified, confirmed } = frontIdCardResult;
        expect(verified).toBeFalsy();
        expect(confirmed).toBeFalsy();
    })

    test("Client confirms front id card", async () => {
        const response = await patchVerificationProcess(verificationId, {
            confirmed: true,
        });
        expect(response.status).toBe(200);
        const data = response.data;
        expect(data).toBeDefined();
        const { frontIdCardResult } = data || {};
        const { verified, confirmed } = frontIdCardResult;
        expect(verified).toBeTruthy();
        expect(confirmed).toBeTruthy();
    })

    test("Client upload back id card", async () => {
        const imagePath = path.join(__dirname, '../assets/backIdCard.jpg');
        const backIdCard = fs.readFileSync(imagePath);
        const formData = new FormData();
        formData.append('file', backIdCard, { filename: 'backIdCard.jpg', contentType: 'image/jpeg', knownLength: backIdCard.length });
        const response = await uploadIdCard(verificationId, formData, 'backIdCards')
        expect(response.status).toBe(200);
        const data = response.data;
        expect(data).toBeDefined();
        const { backIdCardResult } = data;
        expect(backIdCardResult).toBeDefined();
        const { verified, confirmed } = backIdCardResult;
        expect(verified).toBeFalsy();
        expect(confirmed).toBeFalsy();
    })

    test("Client confirms back id card", async () => {
        const response = await patchVerificationProcess(verificationId, {
            confirmed: true,
        }, 'backIdCards');
        expect(response.status).toBe(200);
        const data = response.data;
        expect(data).toBeDefined();
        const { backIdCardResult } = data || {};
        const { verified, confirmed } = backIdCardResult;
        expect(verified).toBeTruthy();
        expect(confirmed).toBeTruthy();
    })

    test("Client confirms dopa", async () => {
        const response = await patchVerificationProcess(verificationId, {
            confirmed: true,
            informed: true,
        }, 'dopa');
        expect(response.status).toBe(200);
        const data = response.data;
        expect(data).toBeDefined();
        const { dopaResult, status } = data || {};
        const { verified, confirmed } = dopaResult;
        expect(verified).toBeTruthy();
        expect(confirmed).toBeTruthy();
        expect(status).toBe('verified');
    })
})