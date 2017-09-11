import admin from 'firebase-admin';
import config from './config';

let instanceValue;

export default () => {
    const { serviceAcc, databaseUrl } = config.settings.firebase;

    if (instanceValue) {
        return instanceValue;
    }
    instanceValue = admin.initializeApp({
        credential: admin.credential.cert(serviceAcc),
        databaseURL: databaseUrl
    });
    return instanceValue;
};
