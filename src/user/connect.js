import path from 'path';
import firebaseInstance from '../config/firebase';
import { api } from '../config/config';
import CONSTANT from '../lib/constant';
import response from '../lib/response';
import Util from '../lib/util';


const scriptName = path.basename(__filename);
console.log(`${scriptName} : starting...`);

const nodeRequest = api.v1.user.connect.request;
const nodeResult = api.v1.user.connect.result;
const nodeUsers = api.v1.user.users;


const requestRef = firebaseInstance().database().ref(nodeRequest);
const resultRef = firebaseInstance().database().ref(nodeResult);
const usersRef = firebaseInstance().database().ref(nodeUsers);

const updateUserStatus = (pushId, uuid, location) => new Promise((resolve, reject) => {
    if (uuid == null) {
        return reject('user not found');
    }

    const { lat, lng } = location || {};
    if (lat == null || lng == null) {
        return reject('location not found, can set mode to ready to pick up');
    }

    Util.getLocation(lat, lng).then((result) => {
        console.log('------>>>', result);

        if (result == null) return reject('location not find, can not update ready driver status');

        usersRef.child(uuid).update({
            location: result.location,
            lastLogin: { '.sv': 'timestamp' }
        }, (error) => {
            if (error) {
                return reject('failed update status ', error);
            }
            return resolve();
        });
        return null;
    }).catch(error => reject(error));
    return null;
});

const onComplete = (snapshot) => {
    const pushId = snapshot.key;
    const val = snapshot.val();

    response.writeOnProgressResult(resultRef, pushId);

    const { uuid, location } = val || {};
    if (uuid == null) {
        response.updateErrorResult(requestRef, resultRef, pushId, 'user not found');
        return null;
    }

    updateUserStatus(pushId, uuid, location).then(() => {
        response.updateSucessResult(requestRef, resultRef, pushId);
    }).catch((error) => {
        response.updateErrorResult(requestRef, resultRef, pushId, error);
    });
    return null;
};

const onError = (error) => {
    console.log(error);
};

const connect = () => {
    requestRef.on(CONSTANT.FIREBASE_EVENT.CHILD_ADDED, onComplete, onError);
};

module.exports.connect = connect;
