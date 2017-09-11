import path from 'path';
import firebaseInstance from '../config/firebase';
import { api } from '../config/config';
import CONSTANT from '../lib/constant';
import response from '../lib/response';
import Util from '../lib/util';


const scriptName = path.basename(__filename);
console.log(`${scriptName} : starting...`);

const nodeRequest = api.v1.driver.presence.request;
const nodeResult = api.v1.driver.presence.result;
const nodeDrivers = api.v1.driver.drivers;
const nodeOrderOngoing = api.v1.order.ongoing;


const requestRef = firebaseInstance().database().ref(nodeRequest);
const resultRef = firebaseInstance().database().ref(nodeResult);
const driversRef = firebaseInstance().database().ref(nodeDrivers);
const orderOngoingRef = firebaseInstance().database().ref(nodeOrderOngoing);

const updateDriverStatus = (pushId, uuid, location) => new Promise((resolve, reject) => {
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
        driversRef.child(uuid).once(CONSTANT.FIREBASE_EVENT.VALUE, (snapshot) => {
            if (snapshot == null || snapshot.val() == null) return reject('can not update location');

            const { order } = snapshot.val() || {};

            driversRef.child(uuid).update({
                location: result.location,
                lastUpdateLocation: { '.sv': 'timestamp' }
            }, (error) => {
                if (error) {
                    return reject('failed update status ', error);
                }
                return resolve();
            });

            if (order != null) {
                const { uid, orderNo } = order || {};
                const loc = result.location;
                orderOngoingRef.child(uid).child(orderNo).child('driver/location')
                    .update(loc, (error) => {
                        if (error) {
                            return reject(error);
                        }
                        return resolve();
                    });
            }
            return null;
        }, error => reject(error));


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

    updateDriverStatus(pushId, uuid, location).then(() => {
        response.updateSucessResult(requestRef, resultRef, pushId);
    }).catch((error) => {
        response.updateErrorResult(requestRef, resultRef, pushId, error);
    });
    return null;
};

const onError = (error) => {
    console.log(error);
};

const presence = () => {
    requestRef.on(CONSTANT.FIREBASE_EVENT.CHILD_ADDED, onComplete, onError);
};

module.exports.presence = presence;
