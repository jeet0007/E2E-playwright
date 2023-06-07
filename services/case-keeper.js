import axios from "axios";
import { caseKeeperBaseUrl } from "../config/env";

const instance = axios.create({
    baseURL: caseKeeperBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    responseType: 'json',
});

