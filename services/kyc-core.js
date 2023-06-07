import axios from "axios";
import { kycBaseUrl } from "../config/env";

const instance = axios.create({
    baseURL: kycBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    responseType: 'json',
});

export const createVerification = async (data, token) => {
    if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return instance.post('/verifications', data);
};

export const getVerification = async (id, token) => {
    if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return instance.get(`/verifications/${id}`);
};


export const patchVerification = async (id, data) => {
    return instance.patch(`/verifications/${id}`, data);
}

export const patchVerificationProcess = async (id, data, process = 'frontIdCards') => {
    return instance.patch(`/verifications/${id}/${process}`, data);
}

export const uploadIdCard = async (id, data, process = 'frontIdCards') => {
    const headers = data.getHeaders();
    return instance.post(`/verifications/${id}/${process}`, data, {
        headers
    });
}
